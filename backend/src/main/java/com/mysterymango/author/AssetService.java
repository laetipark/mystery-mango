package com.mysterymango.author;

import com.mysterymango.common.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import static com.mysterymango.common.Json.map;

@Service
public class AssetService {
    private static final int IMAGE_LIMIT=10*1024*1024,AUDIO_LIMIT=25*1024*1024;
    private final Db db;private final Json json;private final Commands commands;private final Path storage;
    public AssetService(Db db,Json json,Commands commands,@Value("${app.asset-storage-path:.data/assets}")String path){this.db=db;this.json=json;this.commands=commands;this.storage=Path.of(path).toAbsolutePath().normalize();}
    public record Download(Path path,String mimeType,long size,String filename){}
    private record Prepared(byte[] bytes,String mime,String name){}
    public Map<String,Object> list(UUID actor){return map("items",db.list("select id,name,mime_type,size from author_asset where owner_id=? order by created_at desc,id",actor).stream().map(this::dto).toList());}
    private Map<String,Object> dto(Map<String,Object> row){return map("id",row.get("id"),"name",row.get("name"),"mimeType",row.get("mime_type"),"size",row.get("size"));}
    public void requireOwner(UUID actor,UUID id){if(db.optional("select 1 from author_asset where id=? and owner_id=?",id,actor)==null)throw new ApiException(404,"ASSET_NOT_FOUND","파일을 찾을 수 없습니다.");}
    public Map<String,Object> upload(UUID actor,String key,MultipartFile file){
        Prepared prepared=prepare(file);UUID id=UUID.randomUUID();Path stored=storage.resolve(id.toString());
        try{
            Files.createDirectories(storage);Files.write(stored,prepared.bytes(),StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE);
            String fingerprint=fingerprint(prepared.bytes());
            var result=commands.run(actor,key,"asset.upload",map("name",prepared.name(),"mime",prepared.mime(),"sha256",fingerprint),()->{
                long total=((Number)db.one("select coalesce(sum(size),0) n from author_asset where owner_id=?",actor).get("n")).longValue();
                if(total+prepared.bytes().length>512L*1024*1024)throw new ApiException(409,"ASSET_QUOTA_EXCEEDED","작가별 파일 저장 한도 512MB를 초과했습니다.");
                db.update("insert into author_asset(id,owner_id,name,mime_type,size,storage_key) values(?,?,?,?,?,?)",id,actor,prepared.name(),prepared.mime(),prepared.bytes().length,id.toString());
                return map("id",id,"name",prepared.name(),"mimeType",prepared.mime(),"size",prepared.bytes().length);
            },r->requireOwner(actor,UUID.fromString(r.get("id").toString())));
            if(!id.toString().equals(result.get("id").toString()))Files.deleteIfExists(stored);return result;
        }catch(IOException ex){deleteQuietly(stored);throw new ApiException(503,"ASSET_STORAGE_UNAVAILABLE","파일 저장소를 사용할 수 없습니다.");}
        catch(RuntimeException ex){deleteQuietly(stored);throw ex;}
    }
    public Map<String,Object> delete(UUID actor,UUID id){
        if(!TransactionSynchronizationManager.isSynchronizationActive())throw new IllegalStateException("Asset deletion requires Commands transaction");
        requireOwner(actor,id);
        if(db.optional("select 1 from author_version_asset where asset_id=? limit 1",id)!=null)throw new ApiException(409,"ASSET_IN_USE","동결된 작품에서 사용하는 파일은 삭제할 수 없습니다.");
        for(var row:db.list("select document from author_work where owner_id=?",actor))if(AuthorDocument.assetIds(json.object(row.get("document").toString())).contains(id))throw new ApiException(409,"ASSET_IN_USE","편집 중인 작품에서 먼저 파일을 제거해 주세요.");
        Path path=path(db.one("select storage_key from author_asset where id=?",id));db.update("delete from author_asset where id=? and owner_id=?",id,actor);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){deleteQuietly(path);}});return map("ok",true);
    }
    public Download download(UUID actor,UUID id,boolean authorizedContext){
        return commands.transaction(()->downloadLocked(actor,id,authorizedContext));
    }
    private Download downloadLocked(UUID actor,UUID id,boolean authorizedContext){
        var row=db.one("select * from author_asset where id=?",id);
        boolean reviewer=db.optional("select 1 from app_user u where u.id=? and u.admin=true and exists(select 1 from author_version_asset a join scenario_review r on r.version_id=a.version_id where a.asset_id=?)",actor,id)!=null;
        if(!actor.equals(Db.uuid(row,"owner_id"))&&!reviewer&&!authorizedContext)throw new ApiException(404,"ASSET_NOT_FOUND","파일을 찾을 수 없습니다.");
        Path path=path(row);if(!Files.isRegularFile(path,LinkOption.NOFOLLOW_LINKS))throw new ApiException(404,"ASSET_NOT_FOUND","파일을 찾을 수 없습니다.");
        if(actor.equals(Db.uuid(row,"owner_id"))||reviewer)for(var version:db.list("select distinct v.id,v.scenario_id from author_version_asset a join scenario_version v on v.id=a.version_id where a.asset_id=? and coalesce(v.definition->>'gameType','MURDER_MYSTERY')='MURDER_MYSTERY' and (? or exists(select 1 from scenario_review r where r.version_id=v.id))",id,actor.equals(Db.uuid(row,"owner_id")))){
            db.update("insert into scenario_exposure(user_id,scenario_id) values(?,?) on conflict do nothing",actor,version.get("scenario_id"));db.update("insert into scenario_exposure_source(user_id,version_id,source) values(?,?,'AUTHOR_PREVIEW') on conflict do nothing",actor,version.get("id"));
        }
        String mime=Db.str(row,"mime_type");return new Download(path,mime,((Number)row.get("size")).longValue(),"asset."+switch(mime){case "image/png"->"png";case "image/jpeg"->"jpg";case "audio/mpeg"->"mp3";case "audio/ogg"->"ogg";default->"wav";});
    }
    private Path path(Map<String,Object> row){String key=Db.str(row,"storage_key");try{UUID.fromString(key);}catch(RuntimeException ex){throw new ApiException(404,"ASSET_NOT_FOUND","파일을 찾을 수 없습니다.");}Path p=storage.resolve(key).normalize();if(!p.getParent().equals(storage))throw new ApiException(404,"ASSET_NOT_FOUND","파일을 찾을 수 없습니다.");return p;}
    public void validateReferences(UUID actor,Map<String,Object> document,boolean requireKinds){
        validateReferences(actor,document,requireKinds,ValidationContext.failFast());
    }
    public void validateReferences(UUID actor,Map<String,Object> document,boolean requireKinds,ValidationContext context){
        var references=AssetReferences.scan(document,context);
        var ids=new ArrayList<>(new LinkedHashSet<>(references.stream().map(AssetReferences.Reference::id).toList()));
        var owned=new HashMap<UUID,String>();
        for(int offset=0;offset<ids.size();offset+=500){
            var batch=ids.subList(offset,Math.min(offset+500,ids.size()));var args=new ArrayList<Object>();args.add(actor);args.addAll(batch);
            for(var row:db.list("select id,mime_type from author_asset where owner_id=? and id in ("+String.join(",",Collections.nCopies(batch.size(),"?"))+")",args.toArray()))owned.put(Db.uuid(row,"id"),Db.str(row,"mime_type"));
        }
        for(var reference:references){
            String mime=owned.get(reference.id());
            if(context.check(mime!=null,reference.path(),"ASSET_NOT_OWNED","작품에는 본인이 업로드한 파일만 사용할 수 있습니다.")&&requireKinds)
                context.check(mime.startsWith(reference.kind()),reference.path(),"ASSET_KIND_MISMATCH","이미지와 배경음 파일의 용도를 확인해 주세요.");
        }
    }
    private Prepared prepare(MultipartFile file){
        if(file==null||file.isEmpty())throw new ApiException(422,"EMPTY_ASSET","업로드할 파일을 선택해 주세요.");if(file.getSize()>AUDIO_LIMIT)throw new ApiException(413,"ASSET_TOO_LARGE","음원은 25MB, 이미지는 10MB까지 업로드할 수 있습니다.");
        try(InputStream input=file.getInputStream()){
            byte[] bytes=input.readNBytes(AUDIO_LIMIT+1);if(bytes.length>AUDIO_LIMIT)throw new ApiException(413,"ASSET_TOO_LARGE","파일이 너무 큽니다.");String mime;
            if(starts(bytes,new byte[]{(byte)137,80,78,71,13,10,26,10}))mime="image/png";
            else if(bytes.length>3&&(bytes[0]&255)==255&&(bytes[1]&255)==216&&(bytes[2]&255)==255)mime="image/jpeg";
            else if(bytes.length>=12&&ascii(bytes,0,4).equals("RIFF")&&ascii(bytes,8,4).equals("WAVE"))mime="audio/wav";
            else if(bytes.length>=27&&ascii(bytes,0,4).equals("OggS")&&bytes[4]==0)mime="audio/ogg";
            else if(bytes.length>=10&&ascii(bytes,0,3).equals("ID3")&&(bytes[3]==3||bytes[3]==4)||bytes.length>=4&&(bytes[0]&255)==255&&(bytes[1]&224)==224&&(bytes[1]&6)!=0&&(bytes[2]&240)!=0&&(bytes[2]&240)!=240)mime="audio/mpeg";
            else throw new ApiException(422,"UNSUPPORTED_ASSET","PNG·JPEG 이미지 또는 MP3·OGG·WAV 음원을 선택해 주세요.");
            if(mime.startsWith("image/")){
                if(bytes.length>IMAGE_LIMIT)throw new ApiException(413,"ASSET_TOO_LARGE","이미지는 10MB까지 업로드할 수 있습니다.");
                try(var stream=ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))){var readers=ImageIO.getImageReaders(stream);if(!readers.hasNext())throw new IOException();var reader=readers.next();try{reader.setInput(stream);int width=reader.getWidth(0),height=reader.getHeight(0);if(width<1||height<1||width>8192||height>8192||(long)width*height>16000000)throw new ApiException(422,"IMAGE_DIMENSIONS_EXCEEDED","이미지는 가로·세로 8,192px 이하, 총 1,600만 화소 이하로 준비해 주세요.");var image=reader.read(0);var output=new ByteArrayOutputStream();if(!ImageIO.write(image,mime.equals("image/png")?"png":"jpg",output))throw new IOException();bytes=output.toByteArray();if(bytes.length>IMAGE_LIMIT)throw new ApiException(413,"ASSET_TOO_LARGE","처리한 이미지가 10MB를 초과했습니다.");}finally{reader.dispose();}}
            }
            String name=Objects.toString(file.getOriginalFilename(),"파일").replace('\\','/');name=name.substring(name.lastIndexOf('/')+1).replaceAll("[\\p{Cntrl}]","").strip();if(name.isBlank())name="파일";if(name.length()>160)name=name.substring(0,160);return new Prepared(bytes,mime,name);
        }catch(IOException ex){throw new ApiException(422,"INVALID_ASSET","파일 형식을 확인할 수 없습니다. 다른 파일을 선택해 주세요.");}
    }
    private static boolean starts(byte[] value,byte[] prefix){if(value.length<prefix.length)return false;for(int i=0;i<prefix.length;i++)if(value[i]!=prefix[i])return false;return true;}
    private static String fingerprint(byte[] value){try{return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(value));}catch(java.security.NoSuchAlgorithmException ex){throw new IllegalStateException(ex);}}
    private static String ascii(byte[] data,int offset,int length){return new String(data,offset,length,StandardCharsets.US_ASCII);}
    private static void deleteQuietly(Path path){try{Files.deleteIfExists(path);}catch(IOException ex){org.slf4j.LoggerFactory.getLogger(AssetService.class).warn("자산 파일 정리가 지연되었습니다");}}
}
