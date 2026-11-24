package com.momentgrid.api;

import com.momentgrid.analysis.AnalysisService.InvalidRequestException;
import com.momentgrid.api.ApiDtos.ApiError;
import com.momentgrid.project.ProjectService.ProjectNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError(
                "VALIDATION_ERROR",
                "请求参数不符合要求",
                fields
        ));
    }

    @ExceptionHandler(ProjectNotFoundException.class)
    public ResponseEntity<ApiError> projectNotFound(ProjectNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(
                "PROJECT_NOT_FOUND",
                exception.getMessage(),
                Map.of()
        ));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiError> invalidRequest(InvalidRequestException exception) {
        return ResponseEntity.badRequest().body(new ApiError(
                "INVALID_REQUEST",
                exception.getMessage(),
                Map.of()
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> malformedRequest() {
        return ResponseEntity.badRequest().body(new ApiError(
                "MALFORMED_REQUEST",
                "请求内容无法解析，请检查 JSON 与枚举值",
                Map.of()
        ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> invalidPathParameter(MethodArgumentTypeMismatchException exception) {
        return ResponseEntity.badRequest().body(new ApiError(
                "INVALID_PATH_PARAMETER",
                "路径参数格式不正确",
                Map.of(exception.getName(), String.valueOf(exception.getValue()))
        ));
    }
}
