package com.mysterymango.game;

import java.util.*;
import static com.mysterymango.game.Definitions.*;
import static com.mysterymango.game.BoardEngine.check;

/** 오목·리버시·잉글리시 체커의 고정 Java 규칙. 실제 방과 작성자 시험이 동일하게 실행한다. */
public final class ClassicEngine {
    private static final int[][] DIRECTIONS={{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};
    private static final Map<String,String> COLORS=Map.of("boardColor","#d9ad6a","lightSquareColor","#f4e4c1","darkSquareColor","#486b46","firstPieceColor","#242a27","secondPieceColor","#fffaf0");
    public static boolean supports(String type){return type!=null&&Set.of("GOMOKU","REVERSI","CHECKERS").contains(type);}
    public Map<String,Object> initial(String type,Map<String,Object> definition,int capacity){
        check(supports(type)&&capacity==2,"INVALID_CAPACITY","이 게임은 정확히 2명이 필요합니다.");int size=type.equals("GOMOKU")?15:8;int[][] board=new int[size][size];
        if(type.equals("REVERSI")){board[3][3]=2;board[3][4]=1;board[4][3]=1;board[4][4]=2;}
        if(type.equals("CHECKERS"))for(int row=0;row<8;row++)for(int col=0;col<8;col++)if((row+col)%2==1){if(row<3)board[row][col]=2;if(row>4)board[row][col]=1;}
        var appearance=new LinkedHashMap<String,Object>();var configured=map(definition.get("classic"));COLORS.forEach((key,value)->appearance.put(key,configured.getOrDefault(key,value)));
        var state=obj("capacity",2,"turnSeat",0,"activeSeats",new ArrayList<>(List.of(0,1)),"board",rows(board),"finished",false,"winners",List.of(),"draw",false,"endReason",null,"forcedFrom",null,"appearance",appearance,"halfMovesWithoutProgress",0,"repetitions",new LinkedHashMap<String,Object>());
        if(type.equals("CHECKERS"))map(state.get("repetitions")).put(position(board,0),1);return state;
    }
    public void command(String type,Map<String,Object> state,int seat,String action,Map<String,Object> payload){
        check(!bool(state,"finished"),"GAME_FINISHED","종료된 게임입니다.");check(BoardEngine.active(state).contains(seat),"SEAT_INACTIVE","현재 참가자가 아닙니다.");
        if("LEAVE".equals(action)){var active=new ArrayList<>(BoardEngine.active(state));active.remove(Integer.valueOf(seat));state.put("activeSeats",active);finish(state,active.isEmpty()?null:active.getFirst(),"RESIGNATION");return;}
        check(integer(state,"turnSeat",0)==seat,"TURN_REQUIRED","자신의 차례에만 행동할 수 있습니다.");int[][] board=board(state);
        switch(type){
            case "GOMOKU" -> {check("PLACE".equals(action),"INVALID_COMMAND","교차점에 돌을 놓아 주세요.");int row=coordinate(payload,"row",15),col=coordinate(payload,"col",15);check(board[row][col]==0,"OCCUPIED_CELL","이미 돌이 놓인 자리입니다.");board[row][col]=seat+1;state.put("board",rows(board));if(five(board,row,col,seat+1))finish(state,seat,"FIVE_IN_ROW");else if(empty(board)==0)finish(state,null,"BOARD_FULL");else state.put("turnSeat",1-seat);}
            case "REVERSI" -> reversi(state,board,seat,action,payload);
            case "CHECKERS" -> checkers(state,board,seat,action,payload);
            default -> throw BoardEngine.error("INVALID_GAME_TYPE","지원하지 않는 게임입니다.");
        }
    }
    public Map<String,Object> project(String type,Map<String,Object> state,int seat){
        int[][] board=board(state);boolean aborted=bool(state,"aborted");var legal=!bool(state,"finished")&&integer(state,"turnSeat",0)==seat?legal(type,board,seat,map(state.get("forcedFrom"))):List.<Map<String,Object>>of();
        return obj("turnSeat",state.get("turnSeat"),"finished",state.get("finished"),"activeSeats",BoardEngine.active(state),"board",rows(board),"legalMoves",legal,"winners",aborted?List.of():state.getOrDefault("winners",List.of()),"draw",!aborted&&bool(state,"draw"),"endReason",aborted?"ABORTED":state.get("endReason"),"forcedFrom",state.get("forcedFrom"),"counts",counts(board),"appearance",state.get("appearance"));
    }
    private void reversi(Map<String,Object> state,int[][] board,int seat,String action,Map<String,Object> payload){
        check("PLACE".equals(action),"INVALID_COMMAND","돌을 놓을 칸을 선택해 주세요.");int row=coordinate(payload,"row",8),col=coordinate(payload,"col",8);var captured=flips(board,row,col,seat);check(!captured.isEmpty(),"ILLEGAL_MOVE","상대 돌을 포위하는 자리에 놓아 주세요.");board[row][col]=seat+1;for(var p:captured)board[p[0]][p[1]]=seat+1;state.put("board",rows(board));
        if(!reversiMoves(board,1-seat).isEmpty())state.put("turnSeat",1-seat);else if(!reversiMoves(board,seat).isEmpty())state.put("turnSeat",seat);else {var counts=counts(board);finish(state,counts.get(0).equals(counts.get(1))?null:counts.get(0)>counts.get(1)?0:1,empty(board)==0?"BOARD_FULL":"NO_LEGAL_MOVES");}
    }
    private void checkers(Map<String,Object> state,int[][] board,int seat,String action,Map<String,Object> payload){
        check("MOVE".equals(action),"INVALID_COMMAND","이동할 말과 도착 칸을 선택해 주세요.");int fr=coordinate(payload,"fromRow",8),fc=coordinate(payload,"fromCol",8),tr=coordinate(payload,"toRow",8),tc=coordinate(payload,"toCol",8);
        var allowed=checkerMoves(board,seat,map(state.get("forcedFrom")));check(allowed.stream().anyMatch(m->integer(m,"fromRow",-1)==fr&&integer(m,"fromCol",-1)==fc&&integer(m,"row",-1)==tr&&integer(m,"col",-1)==tc),"ILLEGAL_MOVE","의무 포획과 이동 가능한 칸을 확인해 주세요.");
        int piece=board[fr][fc];boolean man=piece<=2,capture=Math.abs(tr-fr)==2;board[fr][fc]=0;board[tr][tc]=piece;if(capture)board[(fr+tr)/2][(fc+tc)/2]=0;
        boolean promoted=man&&(seat==0&&tr==0||seat==1&&tr==7);if(promoted)board[tr][tc]=seat+3;state.put("board",rows(board));
        if(capture||man)state.put("halfMovesWithoutProgress",0);
        if(counts(board).get(1-seat)==0){finish(state,seat,"NO_PIECES");return;}
        if(capture&&!promoted&&!capturesFrom(board,tr,tc,seat).isEmpty()){state.put("forcedFrom",obj("row",tr,"col",tc));return;}
        state.put("forcedFrom",null);int next=1-seat;state.put("turnSeat",next);
        if(checkerMoves(board,next,Map.of()).isEmpty()){finish(state,seat,"NO_LEGAL_MOVES");return;}
        if(!capture&&!man)state.put("halfMovesWithoutProgress",integer(state,"halfMovesWithoutProgress",0)+1);
        var repetitions=new LinkedHashMap<>(map(state.get("repetitions")));String position=position(board,next);int times=integer(repetitions,position,0)+1;repetitions.put(position,times);state.put("repetitions",repetitions);
        if(times>=3)finish(state,null,"REPETITION");else if(integer(state,"halfMovesWithoutProgress",0)>=80)finish(state,null,"NO_PROGRESS");
    }
    private List<Map<String,Object>> legal(String type,int[][] board,int seat,Map<String,Object> forced){return switch(type){case "GOMOKU"->{var moves=new ArrayList<Map<String,Object>>();for(int r=0;r<15;r++)for(int c=0;c<15;c++)if(board[r][c]==0)moves.add(obj("row",r,"col",c));yield moves;}case "REVERSI"->reversiMoves(board,seat);case "CHECKERS"->checkerMoves(board,seat,forced);default->List.of();};}
    private static List<Map<String,Object>> reversiMoves(int[][] board,int seat){var moves=new ArrayList<Map<String,Object>>();for(int row=0;row<8;row++)for(int col=0;col<8;col++)if(!flips(board,row,col,seat).isEmpty())moves.add(obj("row",row,"col",col));return moves;}
    private static List<int[]> flips(int[][] board,int row,int col,int seat){var result=new ArrayList<int[]>();if(board[row][col]!=0)return result;for(var direction:DIRECTIONS){int r=row+direction[0],c=col+direction[1];var line=new ArrayList<int[]>();while(in(r,c,8)&&board[r][c]==2-seat){line.add(new int[]{r,c});r+=direction[0];c+=direction[1];}if(!line.isEmpty()&&in(r,c,8)&&board[r][c]==seat+1)result.addAll(line);}return result;}
    private static List<Map<String,Object>> checkerMoves(int[][] board,int seat,Map<String,Object> forced){
        if(!forced.isEmpty())return capturesFrom(board,integer(forced,"row",-1),integer(forced,"col",-1),seat);
        var captures=new ArrayList<Map<String,Object>>();for(int r=0;r<8;r++)for(int c=0;c<8;c++)if(owner(board[r][c])==seat)captures.addAll(capturesFrom(board,r,c,seat));if(!captures.isEmpty())return captures;
        var moves=new ArrayList<Map<String,Object>>();for(int r=0;r<8;r++)for(int c=0;c<8;c++)if(owner(board[r][c])==seat)for(var d:diagonals(board[r][c],seat)){int tr=r+d[0],tc=c+d[1];if(in(tr,tc,8)&&board[tr][tc]==0)moves.add(move(r,c,tr,tc));}return moves;
    }
    private static List<Map<String,Object>> capturesFrom(int[][] board,int row,int col,int seat){var moves=new ArrayList<Map<String,Object>>();if(!in(row,col,8)||owner(board[row][col])!=seat)return moves;for(var d:diagonals(board[row][col],seat)){int mr=row+d[0],mc=col+d[1],tr=row+2*d[0],tc=col+2*d[1];if(in(tr,tc,8)&&owner(board[mr][mc])==1-seat&&board[tr][tc]==0)moves.add(move(row,col,tr,tc));}return moves;}
    private static int[][] diagonals(int piece,int seat){return piece>=3?new int[][]{{-1,-1},{-1,1},{1,-1},{1,1}}:new int[][]{{seat==0?-1:1,-1},{seat==0?-1:1,1}};}
    private static Map<String,Object> move(int fr,int fc,int tr,int tc){return obj("fromRow",fr,"fromCol",fc,"row",tr,"col",tc);}
    private static boolean five(int[][] board,int row,int col,int value){for(var d:new int[][]{{1,0},{0,1},{1,1},{1,-1}}){int n=1;for(int sign:new int[]{1,-1}){int r=row+d[0]*sign,c=col+d[1]*sign;while(in(r,c,15)&&board[r][c]==value){n++;r+=d[0]*sign;c+=d[1]*sign;}}if(n>=5)return true;}return false;}
    private static void finish(Map<String,Object> state,Integer winner,String reason){state.put("finished",true);state.put("winners",winner==null?List.of():List.of(winner));state.put("draw",winner==null);state.put("endReason",reason);state.put("forcedFrom",null);}
    private static int coordinate(Map<String,Object> payload,String key,int size){Object v=payload.get(key);check(v instanceof Number n&&n.doubleValue()==n.intValue()&&n.intValue()>=0&&n.intValue()<size,"INVALID_POSITION","보드 안의 정수 좌표를 선택해 주세요.");return ((Number)v).intValue();}
    private static boolean in(int r,int c,int size){return r>=0&&c>=0&&r<size&&c<size;}
    private static int owner(int value){return value==1||value==3?0:value==2||value==4?1:-1;}
    private static List<Integer> counts(int[][] board){int[] count={0,0};for(var row:board)for(int v:row)if(owner(v)>=0)count[owner(v)]++;return List.of(count[0],count[1]);}
    private static int empty(int[][] board){int n=0;for(var row:board)for(int v:row)if(v==0)n++;return n;}
    private static String position(int[][] board,int seat){StringBuilder key=new StringBuilder().append(seat).append(':');for(var row:board)for(int value:row)key.append(value);return key.toString();}
    private static int[][] board(Map<String,Object> state){var rows=(List<?>)state.get("board");int[][] board=new int[rows.size()][];for(int r=0;r<rows.size();r++)board[r]=BoardEngine.numbers(rows.get(r)).stream().mapToInt(Integer::intValue).toArray();return board;}
    private static List<List<Integer>> rows(int[][] board){return Arrays.stream(board).map(row->Arrays.stream(row).boxed().toList()).toList();}
}
