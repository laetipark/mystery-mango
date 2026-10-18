package com.mysterymango.author;

import com.mysterymango.auth.Actor;
import com.mysterymango.common.Commands;
import com.mysterymango.game.SceneService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController @RequestMapping("/api/v1")
public class AssetController {
    private final AssetService assets;private final Commands commands;private final SceneService scenes;
    public AssetController(AssetService assets,Commands commands,SceneService scenes){this.assets=assets;this.commands=commands;this.scenes=scenes;}
    @GetMapping("/author/assets") public Map<String,Object> list(){return assets.list(Actor.id());}
    @PostMapping(value="/author/assets",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) public Map<String,Object> upload(@RequestHeader("Idempotency-Key")String key,@RequestPart("file")MultipartFile file){return assets.upload(Actor.id(),key,file);}
    @DeleteMapping("/author/assets/{id}") public Map<String,Object> delete(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){UUID actor=Actor.id();return commands.run(actor,key,"asset.delete:"+id,Map.of(),()->assets.delete(actor,id));}
    @GetMapping("/assets/{id}") public ResponseEntity<FileSystemResource> download(@PathVariable UUID id,@RequestParam(required=false)UUID gameId,@RequestParam(required=false)UUID sandboxId){
        return commands.transaction(()->{UUID actor=Actor.id();boolean allowed=(gameId!=null||sandboxId!=null)&&scenes.canAccessAsset(actor,gameId,sandboxId,id);var download=assets.download(actor,id,allowed);
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(download.mimeType())).contentLength(download.size()).cacheControl(CacheControl.noStore()).header("X-Content-Type-Options","nosniff").header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.inline().filename(download.filename()).build().toString()).body(new FileSystemResource(download.path()));});
    }
}
