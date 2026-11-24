package com.jpproject.dear.correction;

import com.jpproject.dear.common.auth.CurrentUser;
import com.jpproject.dear.correction.dto.CorrectionRequest;
import com.jpproject.dear.correction.dto.CorrectionSubmitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

// API-012 첨삭 제출
@RestController
@RequestMapping("/api/diaries/{diaryId}/corrections")
@RequiredArgsConstructor
public class CorrectionController {

    private final CorrectionService correctionService;

    @PostMapping
    public CorrectionSubmitResponse submit(@RequestAttribute(CurrentUser.ID) Long userId,
                                            @PathVariable Long diaryId,
                                            @RequestBody CorrectionRequest request) {
        return correctionService.submit(userId, diaryId, request);
    }
}
