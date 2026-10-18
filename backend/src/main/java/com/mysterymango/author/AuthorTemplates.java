package com.mysterymango.author;

import com.mysterymango.common.ApiException;
import java.util.*;
import static com.mysterymango.common.Json.map;

final class AuthorTemplates {
    private static final Set<String> CLASSIC=Set.of("GOMOKU","REVERSI","CHECKERS");
    private AuthorTemplates() {}
    static List<Map<String,Object>> catalog(){
        var visuals=List.of("작품 이름과 소개","장면·글자·이미지·배경음","판과 말의 다섯 가지 색");
        var starters=List.of(
            metadata("mystery-starter","머더미스터리 기본 틀","두 역할과 한 가지 단서에서 이야기를 시작합니다.","MURDER_MYSTERY",List.of(2),List.of("작품 이름과 소개","장면·글자·이미지·배경음","역할과 개인 자료","단계·조사·단서·투표·결말","조건과 효과"),"역할별 자료를 읽고 단서를 조사한 뒤 범인을 투표합니다. 역할 수에 맞춰 1~4인 작품으로 편집할 수 있습니다."),
            metadata("tabletop-starter","자유 테이블 기본 틀","주사위·카운터·카드 덱을 놓고 직접 진행하는 테이블입니다.","TABLETOP",List.of(1,2,3,4),List.of("작품 이름과 소개","장면·글자·이미지·배경음","카드·토큰·주사위·카운터","덱 구성과 카드 앞뒷면"),"참가자가 구성물을 옮기고 카드를 뽑습니다. 점수 기록과 게임 종료는 직접 진행합니다."),
            metadata("yacht-starter","요트 기본 틀","다섯 주사위로 점수 항목을 채우는 게임입니다.","YACHT",List.of(1,2,3,4),List.of("작품 이름과 소개","장면·글자·이미지·배경음","주사위·눈·점수판의 세 가지 색"),"한 차례에 세 번까지 굴리고 주사위를 고정할 수 있습니다. 열두 점수 항목과 보너스·순위는 서버가 계산합니다."),
            metadata("gomoku-starter","오목 기본 틀","한 줄에 돌을 이어 놓는 2인 오목입니다.","GOMOKU",List.of(2),visuals,classicRules("GOMOKU")),
            metadata("reversi-starter","리버시 기본 틀","돌을 끼워 뒤집으며 판을 채우는 2인 게임입니다.","REVERSI",List.of(2),visuals,classicRules("REVERSI")),
            metadata("checkers-starter","체커 기본 틀","대각선 이동과 연속 포획을 겨루는 2인 체커입니다.","CHECKERS",List.of(2),visuals,classicRules("CHECKERS")));
        var result=new ArrayList<>(starters);
        for(var starter:starters){
            var blank=new LinkedHashMap<>(starter);
            blank.put("id",starter.get("id").toString().replace("-starter","-blank"));
            blank.put("title",starter.get("title").toString().replace("기본 틀","빈 템플릿"));
            blank.put("description",switch(starter.get("gameType").toString()){
                case "MURDER_MYSTERY"->"빈 장면에서 역할·단계·단서·결말을 직접 구성합니다.";
                case "TABLETOP"->"구성물이 없는 테이블에 카드·말·주사위·카운터를 직접 추가합니다.";
                default->"고정된 게임 규칙을 유지하고 소개와 빈 장면의 디자인을 직접 작성합니다.";
            });
            blank.put("blank",true);result.add(blank);
        }
        return List.copyOf(result);
    }
    private static Map<String,Object> metadata(String id,String title,String description,String gameType,List<Integer> counts,List<String> customizable,String rules){return map("id",id,"title",title,"description",description,"gameType",gameType,"playerCounts",counts,"customizable",customizable,"rulesSummary",rules,"blank",false);}
    static String resolveType(String gameType,String templateId){
        if(templateId==null)return Objects.toString(gameType,"");
        var template=catalog().stream().filter(t->templateId.equals(t.get("id"))).findFirst().orElseThrow(()->new ApiException(422,"UNKNOWN_TEMPLATE","사용할 수 있는 템플릿을 선택해 주세요."));
        String type=template.get("gameType").toString();if(gameType!=null&&!type.equals(gameType))throw new ApiException(422,"TEMPLATE_TYPE_MISMATCH","템플릿과 게임 유형이 일치하지 않습니다.");return type;
    }
    static Map<String,Object> create(String title,String gameType,String slug,String templateId){
        String type=resolveType(gameType,templateId);var document=create(title,type,slug);
        boolean blank=templateId!=null&&catalog().stream().anyMatch(t->templateId.equals(t.get("id"))&&Boolean.TRUE.equals(t.get("blank")));
        if(!blank)return document;
        document.put("synopsis","");
        for(String list:List.of("roles","phases","targets","clues","rules","endings"))document.put(list,List.of());
        document.put("tabletop",map("objects",List.of(),"decks",List.of()));
        document.put("presentation",map("scenes",List.of(map("id","opening","name","첫 장면","kind","SCENE","referenceId","","phaseIds",List.of(),"width",1280,"height",720,"background","#18202b","bgmAssetId",null,"nodes",List.of())),"cardLayouts",List.of()));
        if(type.equals("MURDER_MYSTERY"))document.put("ballot",map("culpritRoleId","","allowChange",true,"allowAbstain",true,"tiePolicy","NO_ACCUSATION"));
        return document;
    }
    static Map<String,Object> create(String title,String gameType,String slug){
        if(!Set.of("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS").contains(gameType))throw new ApiException(422,"INVALID_GAME_TYPE","게임 유형을 선택해 주세요.");
        var d=map("schemaVersion",1,"slug",slug,"title",title,"synopsis","작품 소개를 작성해 주세요.","language","ko","playerCount",2,"supportedPlayerCounts",List.of(2),"estimatedMinutes",30,"genre","창작","difficulty","EASY","modes",List.of("TEXT"),"gameType",gameType,"engineId",switch(gameType){case "TABLETOP"->"tabletop-v1";case "YACHT"->"yacht-v1";case "GOMOKU"->"gomoku-v1";case "REVERSI"->"reversi-v1";case "CHECKERS"->"checkers-v1";default->"mystery-v1";},"roles",List.of(),"phases",List.of(),"targets",List.of(),"clues",List.of(),"rules",List.of(),"endings",List.of(),"ballot",Map.of(),"tabletop",map("objects",List.of(),"decks",List.of()));
        d.put("presentation",map("scenes",List.of(map("id","opening","name","첫 장면","kind","SCENE","referenceId","","phaseIds",List.of(),"width",1280,"height",720,"background","#18202b","bgmAssetId",null,"nodes",List.of(map("id","title","kind","TEXT","x",80,"y",80,"width",1120,"height",100,"rotation",0,"fill","#ffffff","text",title,"fontSize",48,"assetId",null,"locked",false,"hidden",false,"bindingType","NONE","bindingId",""))))));
        if(gameType.equals("MURDER_MYSTERY")){
            d.put("roles",List.of(role("role-1","첫 번째 인물"),role("role-2","두 번째 인물")));
            d.put("phases",List.of(phase("reading","READING",List.of(),0),phase("investigation","INVESTIGATION",List.of("CHAT","INVESTIGATE","SHARE","WHISPER"),1),phase("vote","VOTE",List.of("CHAT","VOTE"),0),phase("ending","ENDING",List.of("CHAT"),0)));
            d.put("clues",List.of(map("id","clue-1","title","첫 번째 단서","text","단서의 내용을 작성해 주세요.","sharePolicy","PUBLIC_AND_WHISPER")));
            d.put("targets",List.of(map("id","target-1","name","첫 번째 조사 장소","phaseIds",List.of("investigation"),"clueIds",List.of("clue-1"))));
            d.put("ballot",map("culpritRoleId","role-1","allowChange",true,"allowAbstain",true,"tiePolicy","NO_ACCUSATION"));
            d.put("endings",List.of(map("id","solved","title","사건 해결","text","범인을 지목했을 때의 결말입니다.","condition",map("type","CULPRIT_IDENTIFIED")),map("id","unresolved","title","남은 이야기","text","기권하거나 다른 인물을 지목했을 때의 결말입니다.","condition",map("type","ALWAYS"))));
        }else{
            d.put("supportedPlayerCounts",CLASSIC.contains(gameType)?List.of(2):List.of(1,2,3,4));
            if(CLASSIC.contains(gameType)){
                d.put("classic",map("boardColor","#d9ad6a","lightSquareColor","#f4e4c1","darkSquareColor","#486b46","firstPieceColor","#242a27","secondPieceColor","#fffaf0"));
                String description=classicRules(gameType);d.put("synopsis",description);d.put("genre","클래식 보드게임");
                d.put("presentation",map("scenes",List.of(map("id","opening","name","규칙 안내","kind","SCENE","referenceId","","phaseIds",List.of(),"width",1280,"height",720,"background","#18202b","bgmAssetId",null,"nodes",List.of(textNode("title",title,80,48,100),textNode("rules",description,220,30,420))))));
            }
            if(gameType.equals("YACHT"))d.put("yacht",map("diceColor","#fffaf0","pipColor","#242a27","scoreboardColor","#ffffff"));
            if(gameType.equals("TABLETOP"))d.put("tabletop",map("objects",List.of(map("id","dice-1","kind","DICE","name","주사위","text","","assetId",null,"backAssetId",null,"x",100,"y",200,"width",80,"height",80,"locked",false,"faceUp",true,"sides",6,"value",1),map("id","counter-1","kind","COUNTER","name","점수","text","","assetId",null,"backAssetId",null,"x",220,"y",200,"width",80,"height",80,"locked",false,"faceUp",true,"sides",6,"value",0)),"decks",List.of(map("id","deck-1","name","연습 카드","backAssetId",null,"x",400,"y",200,"cards",List.of(map("id","card-1","name","첫 카드","text","카드 내용을 작성해 주세요.","assetId",null),map("id","card-2","name","두 번째 카드","text","카드 내용을 작성해 주세요.","assetId",null))))));
        }return d;
    }
    private static Map<String,Object> textNode(String id,String text,int y,int fontSize,int height){return map("id",id,"kind","TEXT","x",80,"y",y,"width",1120,"height",height,"rotation",0,"fill","#ffffff","text",text,"fontSize",fontSize,"assetId",null,"locked",false,"hidden",false,"bindingType","NONE","bindingId","");}
    private static String classicRules(String type){return switch(type){
        case "GOMOKU"->"15×15 교차점에 번갈아 돌을 놓습니다. 가로·세로·대각선 중 한 줄에 자신의 돌을 다섯 개 이상 연결하면 승리합니다. 금수는 없으며, 빈자리가 모두 차도록 승자가 없으면 무승부입니다.";
        case "REVERSI"->"8×8 판에서 상대 돌을 자신의 돌 사이에 끼워 뒤집습니다. 적어도 한 돌을 뒤집을 수 있는 칸에만 놓을 수 있습니다. 둘 곳이 없는 차례는 자동으로 넘어가고 두 사람 모두 둘 수 없으면 종료합니다. 마지막에 돌이 더 많은 사람이 승리하며 같으면 무승부입니다.";
        default->"8×8 판의 어두운 칸에서 대결하는 잉글리시 체커입니다. 일반 말은 앞으로 대각선 한 칸, 왕은 앞뒤로 한 칸 움직입니다. 잡을 수 있으면 반드시 잡고 같은 말로 가능한 연속 포획을 마칩니다. 상대 끝줄에서 왕이 되면 그 차례는 끝납니다. 상대 말이나 가능한 수가 없으면 승리합니다. 같은 판과 차례가 세 번 반복되거나 포획·일반 말 이동 없이 80반수가 지나면 무승부입니다.";
    };}
    private static Map<String,Object> role(String id,String name){return map("id",id,"name",name,"publicIntro","다른 참가자에게 공개할 소개입니다.","secret","이 역할만 읽는 비밀입니다.","objective",map("text","개인 목표를 작성해 주세요.","condition",map("type","ALWAYS")));}
    private static Map<String,Object> phase(String id,String kind,List<String> actions,int limit){return map("id",id,"kind",kind,"durationSeconds",300,"actions",actions,"publicText","이 단계의 안내를 작성해 주세요.","investigationLimit",limit);}
}
