package com.mysterymango.common;

/** 원문 값이나 비밀 자료를 포함하지 않는 작성 오류. 경로는 저장 문서의 배열 인덱스를 따른다. */
public record ValidationIssue(String path, String code, String message, String severity) {
    public ValidationIssue(String path, String code, String message) {
        this(path, code, message, "ERROR");
    }
}
