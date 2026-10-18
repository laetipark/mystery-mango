package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import java.security.SecureRandom;
import java.util.*;
import java.util.random.RandomGenerator;
import static com.mysterymango.game.Definitions.*;

/** 서버와 작성자 시험에서 함께 쓰는 보드게임 상태 계산. 저장이나 사용자 인증은 호출자가 담당한다. */
public final class BoardEngine {
    public static final List<String> CATEGORIES=List.of("ONES","TWOS","THREES","FOURS","FIVES","SIXES","CHOICE","FOUR_KIND","FULL_HOUSE","SMALL_STRAIGHT","LARGE_STRAIGHT","YACHT");
    private final RandomGenerator random;
    private final ClassicEngine classic=new ClassicEngine();
    public BoardEngine(){this(new SecureRandom());}
    public BoardEngine(RandomGenerator random){this.random=random;}
    public Map<String,Object> initial(String type,Map<String,Object> definition,int capacity){
        if(ClassicEngine.supports(type))return classic.initial(type,definition,capacity);
        check(capacity>=1&&capacity<=4,"INVALID_CAPACITY","지원하지 않는 인원입니다.");
        var s=obj("capacity",capacity,"turnSeat",0,"finished",false,"activeSeats",new ArrayList<>(java.util.stream.IntStream.range(0,capacity).boxed().toList()));
        if(type.equals("YACHT")) {
            var design=map(definition.get("yacht"));s.put("appearance",obj("diceColor",design.getOrDefault("diceColor","#fffaf0"),"pipColor",design.getOrDefault("pipColor","#242a27"),"scoreboardColor",design.getOrDefault("scoreboardColor","#ffffff")));
            s.put("dice",new ArrayList<>(List.of(0,0,0,0,0)));s.put("held",new ArrayList<>(List.of(false,false,false,false,false)));s.put("rollsRemaining",3);
            var scores=new ArrayList<Map<String,Object>>();for(int i=0;i<capacity;i++)scores.add(obj("seat",i,"categories",new LinkedHashMap<String,Object>()));s.put("scores",scores);s.put("winners",List.of());
        } else {
            check(type.equals("TABLETOP"),"INVALID_GAME_TYPE","지원하지 않는 게임입니다.");
            var t=map(definition.get("tabletop"));var pieces=new ArrayList<Map<String,Object>>();
            for(var o:objects(t.get("objects"))){var p=new LinkedHashMap<>(o);if("CARD".equals(str(o,"kind")))opaqueCard(p);p.put("ownerSeat",null);pieces.add(p);}
            var decks=new ArrayList<Map<String,Object>>();for(var d:objects(t.get("decks"))){var deck=new LinkedHashMap<>(d);var cards=new ArrayList<Map<String,Object>>();for(var c:objects(d.get("cards"))){var card=new LinkedHashMap<>(c);opaqueCard(card);cards.add(card);}shuffle(cards);deck.put("cards",cards);decks.add(deck);}
            s.put("objects",pieces);s.put("decks",decks);s.put("cardLayouts",objects(map(definition.get("presentation")).get("cardLayouts")));
        }
        return s;
    }
    public void command(String gameType,Map<String,Object> s,int seat,boolean host,String type,Map<String,Object> p){
        check(type!=null&&!type.isBlank(),"INVALID_COMMAND","행동을 선택해 주세요.");
        if(ClassicEngine.supports(gameType)){classic.command(gameType,s,seat,type,p);return;}
        check(!bool(s,"finished"),"GAME_FINISHED","종료된 게임입니다.");
        check(active(s).contains(seat),"SEAT_INACTIVE","현재 참가자가 아닙니다.");
        if(type.equals("LEAVE")){boolean current=integer(s,"turnSeat",0)==seat;var seats=new ArrayList<>(active(s));seats.remove(Integer.valueOf(seat));s.put("activeSeats",seats);if(seats.isEmpty()){s.put("finished",true);return;}if(current)next(s,seat);if(gameType.equals("YACHT")){finishYachtIfComplete(s);if(current&&!bool(s,"finished")){while(map(scoreRow(s,integer(s,"turnSeat",0)).get("categories")).size()==12)next(s,integer(s,"turnSeat",0));resetDice(s);}}return;}
        if(gameType.equals("YACHT"))yacht(s,seat,type,p);else tabletop(s,seat,host,type,p);
    }
    public Map<String,Object> project(String type,Map<String,Object> s,int seat){
        if(ClassicEngine.supports(type))return classic.project(type,s,seat);
        var out=obj("turnSeat",s.get("turnSeat"),"finished",s.get("finished"),"activeSeats",active(s));
        if(type.equals("YACHT")){
            out.put("appearance",s.getOrDefault("appearance",obj("diceColor","#fffaf0","pipColor","#242a27","scoreboardColor","#ffffff")));
            out.put("dice",s.get("dice"));out.put("held",s.get("held"));out.put("rollsRemaining",s.get("rollsRemaining"));out.put("winners",s.getOrDefault("winners",List.of()));
            out.put("scores",objects(s.get("scores")).stream().map(row->{var c=map(row.get("categories"));int upper=upper(c),seatId=integer(row,"seat",-1);boolean forfeited=!active(s).contains(seatId);Object rank=bool(s,"finished")&&!bool(s,"aborted")&&!forfeited?1+objects(s.get("scores")).stream().filter(other->active(s).contains(integer(other,"seat",-1))&&total(map(other.get("categories")))>total(c)).count():null;return obj("seat",row.get("seat"),"categories",new LinkedHashMap<>(c),"upperTotal",upper,"bonus",upper>=63?35:0,"total",total(c),"forfeited",forfeited,"rank",rank);}).toList());
            var available=new LinkedHashMap<String,Object>();if(!bool(s,"finished")&&integer(s,"turnSeat",0)==seat&&integer(s,"rollsRemaining",3)<3){var used=map(scoreRow(s,seat).get("categories"));for(String category:CATEGORIES)if(!used.containsKey(category))available.put(category,score(category,numbers(s.get("dice"))));}out.put("availableScores",available);
        }else{
            var pieces=new ArrayList<Map<String,Object>>();for(var o:objects(s.get("objects"))){Integer owner=owner(o);if(owner!=null&&owner!=seat)continue;var v=new LinkedHashMap<String,Object>();for(String key:List.of("id","kind","name","text","assetId","backAssetId","x","y","width","height","locked","faceUp","ownerSeat","sides","value"))if(o.containsKey(key))v.put(key,o.get(key));if("CARD".equals(str(o,"kind")))CardDesign.applyToCard(s,o,v,seat);pieces.add(v);}out.put("objects",pieces);
            out.put("decks",objects(s.get("decks")).stream().map(d->{var v=obj("id",d.get("id"),"name",d.get("name"),"x",d.getOrDefault("x",0),"y",d.getOrDefault("y",0),"count",objects(d.get("cards")).size());var design=CardDesign.face(s,d.get("backLayoutId"),false);if(design==null)v.put("backAssetId",d.get("backAssetId"));else v.put("backDesign",design);return v;}).toList());
            int capacity=integer(s,"capacity",4);out.put("hands",java.util.stream.IntStream.range(0,capacity).mapToObj(i->obj("seat",i,"count",objects(s.get("objects")).stream().filter(o->Objects.equals(owner(o),i)).count())).toList());
        }
        return out;
    }
    private void tabletop(Map<String,Object> s,int seat,boolean host,String type,Map<String,Object> p){
        if(type.equals("FINISH")){check(host,"HOST_REQUIRED","방장만 게임을 종료할 수 있습니다.");s.put("finished",true);return;}
        if(type.equals("NEXT_TURN")){check(host||integer(s,"turnSeat",0)==seat,"TURN_REQUIRED","현재 차례에만 넘길 수 있습니다.");next(s,integer(s,"turnSeat",0));return;}
        if(type.equals("DRAW")||type.equals("SHUFFLE")){
            var deck=required(objects(s.get("decks")),str(p,"deckId"));var cards=new ArrayList<>(objects(deck.get("cards")));
            if(type.equals("SHUFFLE")){shuffle(cards);deck.put("cards",cards);return;}
            check(!cards.isEmpty(),"DECK_EMPTY","덱에 카드가 없습니다.");int recipient=p.get("toSeat")==null?seat:seatValue(p.get("toSeat"));check(recipient==seat,"DRAW_SELF_ONLY","자신의 손패로만 뽑을 수 있습니다.");
            var c=new LinkedHashMap<>(cards.removeFirst());c.putAll(obj("kind","CARD","ownerSeat",seat,"faceUp",false,"backAssetId",deck.get("backAssetId"),"backLayoutId",deck.get("backLayoutId"),"x",deck.getOrDefault("x",0),"y",deck.getOrDefault("y",0),"width",120,"height",170,"locked",false));
            var pieces=new ArrayList<>(objects(s.get("objects")));pieces.add(c);s.put("objects",pieces);deck.put("cards",cards);return;
        }
        var o=required(objects(s.get("objects")),str(p,"objectId"));Integer owner=owner(o);check(owner==null||owner==seat,"OBJECT_PRIVATE","다른 참가자의 손패를 조작할 수 없습니다.");check(!bool(o,"locked")||host,"OBJECT_LOCKED","잠긴 구성물입니다.");
        switch(type){
            case "MOVE" -> {o.put("x",coordinate(p,"x"));o.put("y",coordinate(p,"y"));}
            case "FLIP" -> {check(str(o,"kind").equals("CARD"),"NOT_CARD","카드만 뒤집을 수 있습니다.");o.put("faceUp",!bool(o,"faceUp"));}
            case "TRANSFER" -> {check(str(o,"kind").equals("CARD"),"NOT_CARD","카드만 손패로 옮길 수 있습니다.");Integer target=p.get("toSeat")==null?null:seatValue(p.get("toSeat"));check(target==null||active(s).contains(target),"INVALID_SEAT","참가자를 확인해 주세요.");o.put("ownerSeat",target);if(target!=null)o.put("faceUp",false);}
            case "ROLL" -> {check(str(o,"kind").equals("DICE"),"NOT_DICE","주사위를 선택해 주세요.");int sides=integer(o,"sides",6);check(sides>=2&&sides<=100,"INVALID_DICE","주사위 면 수가 올바르지 않습니다.");o.put("value",random.nextInt(1,sides+1));}
            case "COUNTER" -> {check(str(o,"kind").equals("COUNTER"),"NOT_COUNTER","카운터를 선택해 주세요.");Object value=p.get("value");check(value instanceof Number n&&n.doubleValue()==n.intValue()&&Math.abs(n.longValue())<=1000000,"INVALID_COUNTER","카운터는 백만 이내의 정수여야 합니다.");o.put("value",((Number)value).intValue());}
            default -> throw error("INVALID_COMMAND","지원하지 않는 행동입니다.");
        }
    }
    private void yacht(Map<String,Object> s,int seat,String type,Map<String,Object> p){
        check(integer(s,"turnSeat",0)==seat,"TURN_REQUIRED","자신의 차례에만 행동할 수 있습니다.");int rolls=integer(s,"rollsRemaining",3);
        switch(type){
            case "ROLL" -> {check(rolls>0,"ROLL_LIMIT","점수를 선택해 주세요.");var dice=new ArrayList<>(numbers(s.get("dice")));var held=booleans(s.get("held"));for(int i=0;i<5;i++)if(!held.get(i))dice.set(i,random.nextInt(1,7));s.put("dice",dice);s.put("rollsRemaining",rolls-1);}
            case "HOLD" -> {check(rolls<3&&rolls>0,"HOLD_UNAVAILABLE","다시 굴릴 수 있을 때 고정해 주세요.");var indices=numbers(p.get("indices"));check(new HashSet<>(indices).size()==indices.size()&&indices.stream().allMatch(i->i>=0&&i<5),"INVALID_DICE_INDEX","주사위 위치를 확인해 주세요.");s.put("held",java.util.stream.IntStream.range(0,5).mapToObj(indices::contains).toList());}
            case "SCORE" -> {check(rolls<3,"ROLL_REQUIRED","먼저 주사위를 굴려 주세요.");String category=str(p,"category");check(CATEGORIES.contains(category),"INVALID_CATEGORY","점수 항목을 확인해 주세요.");var row=scoreRow(s,seat);var categories=new LinkedHashMap<>(map(row.get("categories")));check(!categories.containsKey(category),"CATEGORY_USED","이미 선택한 점수 항목입니다.");categories.put(category,score(category,numbers(s.get("dice"))));row.put("categories",categories);finishYachtIfComplete(s);if(!bool(s,"finished")){next(s,seat);while(map(scoreRow(s,integer(s,"turnSeat",0)).get("categories")).size()==12)next(s,integer(s,"turnSeat",0));resetDice(s);}}
            default -> throw error("INVALID_COMMAND","지원하지 않는 행동입니다.");
        }
    }
    public static int score(String category,List<Integer> dice){
        check(dice.size()==5&&dice.stream().allMatch(d->d>=1&&d<=6),"INVALID_DICE","주사위 값이 올바르지 않습니다.");int[] counts=new int[7];dice.forEach(d->counts[d]++);int sum=dice.stream().mapToInt(Integer::intValue).sum();int idx=CATEGORIES.indexOf(category);if(idx>=0&&idx<6)return counts[idx+1]*(idx+1);
        int max=Arrays.stream(counts).max().orElse(0);return switch(category){
            case "CHOICE"->sum;case "FOUR_KIND"->max>=4?sum:0;case "FULL_HOUSE"->max==3&&Arrays.stream(counts).anyMatch(c->c==2)?sum:0;
            case "SMALL_STRAIGHT"->run(counts)>=4?15:0;case "LARGE_STRAIGHT"->run(counts)>=5?30:0;case "YACHT"->max==5?50:0;default->throw error("INVALID_CATEGORY","점수 항목을 확인해 주세요.");};
    }
    private static int run(int[] c){int best=0,n=0;for(int i=1;i<=6;i++){n=c[i]>0?n+1:0;best=Math.max(best,n);}return best;}
    private static int upper(Map<String,Object> c){return CATEGORIES.subList(0,6).stream().mapToInt(k->integer(c,k,0)).sum();}
    private static int total(Map<String,Object> c){return CATEGORIES.stream().mapToInt(k->integer(c,k,0)).sum()+(upper(c)>=63?35:0);}
    private static void finishYachtIfComplete(Map<String,Object> s){if(active(s).isEmpty()||active(s).stream().allMatch(i->map(scoreRow(s,i).get("categories")).size()==12)){s.put("finished",true);int best=objects(s.get("scores")).stream().filter(r->active(s).contains(integer(r,"seat",-1))).mapToInt(r->total(map(r.get("categories")))).max().orElse(0);s.put("winners",objects(s.get("scores")).stream().filter(r->active(s).contains(integer(r,"seat",-1))&&total(map(r.get("categories")))==best).map(r->r.get("seat")).toList());}}
    private static void resetDice(Map<String,Object> s){s.put("dice",new ArrayList<>(List.of(0,0,0,0,0)));s.put("held",new ArrayList<>(List.of(false,false,false,false,false)));s.put("rollsRemaining",3);}
    private static Map<String,Object> scoreRow(Map<String,Object> s,int seat){return objects(s.get("scores")).stream().filter(r->integer(r,"seat",-1)==seat).findFirst().orElseThrow(()->error("INVALID_SEAT","참가자를 확인해 주세요."));}
    private static void next(Map<String,Object> s,int current){var seats=active(s);s.put("turnSeat",seats.stream().filter(i->i>current).findFirst().orElse(seats.getFirst()));}
    static List<Integer> active(Map<String,Object> s){return numbers(s.get("activeSeats"));}
    static List<Integer> numbers(Object value){if(!(value instanceof List<?> l))throw error("INVALID_INPUT","숫자 배열이 필요합니다.");return l.stream().map(x->{if(!(x instanceof Number n)||n.doubleValue()!=n.intValue())throw error("INVALID_INPUT","정수가 필요합니다.");return ((Number)x).intValue();}).toList();}
    private static List<Boolean> booleans(Object value){return ((List<?>)value).stream().map(Boolean.TRUE::equals).toList();}
    private static Integer owner(Map<String,Object> o){return o.get("ownerSeat") instanceof Number n?n.intValue():null;}
    private static void opaqueCard(Map<String,Object> card){card.put("definitionId",card.get("id"));card.put("id",UUID.randomUUID().toString());}
    private static int seatValue(Object value){check(value instanceof Number n&&n.doubleValue()==n.intValue(),"INVALID_SEAT","참가자 자리는 정수여야 합니다.");return ((Number)value).intValue();}
    private static Map<String,Object> required(List<Map<String,Object>> list,String id){return list.stream().filter(o->id.equals(str(o,"id"))).findFirst().orElseThrow(()->error("OBJECT_NOT_FOUND","구성물을 찾을 수 없습니다."));}
    private static double coordinate(Map<String,Object> p,String key){Object v=p.get(key);check(v instanceof Number n&&Double.isFinite(n.doubleValue())&&Math.abs(n.doubleValue())<=100000,"INVALID_POSITION","위치가 올바르지 않습니다.");return ((Number)v).doubleValue();}
    private <T>void shuffle(List<T> list){for(int i=list.size()-1;i>0;i--){int j=random.nextInt(i+1);Collections.swap(list,i,j);}}
    static void check(boolean valid,String code,String message){if(!valid)throw error(code,message);}
    static ApiException error(String code,String message){return new ApiException(code.equals("TURN_REQUIRED")||code.equals("OBJECT_PRIVATE")||code.equals("HOST_REQUIRED")?403:422,code,message);}
}
