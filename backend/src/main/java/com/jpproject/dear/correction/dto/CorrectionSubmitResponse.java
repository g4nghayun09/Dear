package com.jpproject.dear.correction.dto;

import java.time.LocalDateTime;

public record CorrectionSubmitResponse(Long diaryId, String status, LocalDateTime correctedAt, int count) {
}
