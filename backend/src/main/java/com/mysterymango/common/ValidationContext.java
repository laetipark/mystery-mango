package com.mysterymango.common;

import java.util.*;

/** 동일한 검사에서 엄격 검증과 제한된 오류 수집을 선택한다. 요청마다 새로 생성한다. */
public final class ValidationContext {
    public static final int MAX_ISSUES = 100;
    private final boolean failFast;
    private final LinkedHashSet<ValidationIssue> issues = new LinkedHashSet<>();
    private boolean truncated;

    private ValidationContext(boolean failFast) { this.failFast = failFast; }
    public static ValidationContext failFast() { return new ValidationContext(true); }
    public static ValidationContext collecting() { return new ValidationContext(false); }
    public List<ValidationIssue> issues() { return List.copyOf(issues); }
    public boolean truncated() { return truncated; }
    public boolean valid() { return issues.isEmpty() && !truncated; }
    public boolean hasIssueAt(String path) { return issues.stream().anyMatch(issue->issue.path().equals(path)); }

    public void run(Runnable checks) {
        try { checks.run(); }
        catch (LimitReached ignored) { /* 101번째 고유 오류를 발견한 시점에 검사를 끝낸다. */ }
    }

    public boolean check(boolean valid, String path, String code, String message) {
        if (valid) return true;
        if (failFast) throw new ApiException(422, code, code.equals("INVALID_PRESENTATION") ? path+": "+message : message);
        var issue = new ValidationIssue(path, code, message);
        if (issues.contains(issue)) return false;
        if (issues.size() == MAX_ISSUES) {
            truncated = true;
            throw new LimitReached();
        }
        issues.add(issue);
        return false;
    }

    @SuppressWarnings("unchecked")
    public Map<String,Object> object(Object value, String path, String code, String message) {
        return check(value instanceof Map<?,?>, path, code, message) ? (Map<String,Object>) value : null;
    }

    public List<?> array(Object value, String path, String code, int min, int max, String message) {
        if (!check(value instanceof List<?>, path, code, message)) return null;
        var list = (List<?>) value;
        if (!check(list.size() <= max, path, code, message)) return null;
        check(list.size() >= min, path, code, message);
        return list;
    }

    public boolean text(Map<String,Object> object, String key, int max, String path, String code) {
        return check(object.get(key) instanceof String s && !s.isBlank() && s.length() <= max,
            field(path,key), code, "필수 텍스트와 길이를 확인해 주세요.");
    }
    public boolean number(Map<String,Object> object, String key, double min, double max, String path, String code) {
        return check(object.get(key) instanceof Number n && Double.isFinite(n.doubleValue()) && n.doubleValue() >= min && n.doubleValue() <= max,
            field(path,key), code, "숫자 값의 허용 범위를 확인해 주세요.");
    }
    public boolean color(Map<String,Object> object, String key, String path, String code) {
        return check(object.get(key) instanceof String s && s.matches("#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?"),
            field(path,key), code, "색상은 #RRGGBB 또는 #RRGGBBAA 형식으로 지정해 주세요.");
    }
    public boolean id(Map<String,Object> object, Set<String> ids, String path, String code) {
        Object value=object.get("id");
        if (!check(value instanceof String s && s.matches("[A-Za-z0-9_-]{1,100}"), field(path,"id"), code, "ID는 영문·숫자·밑줄·하이픈으로 입력해 주세요.")) return false;
        return check(ids.add((String)value), field(path,"id"), code, "ID는 중복 없이 입력해 주세요.");
    }
    public static String field(String path,String key) { return path.isEmpty() ? key : path+"."+key; }
    public static String string(Map<String,Object> object,String key) { return Objects.toString(object.get(key),""); }
    private static final class LimitReached extends RuntimeException {
        LimitReached() { super(null,null,false,false); }
    }
}
