package com.jpproject.dear.dto;

import java.util.List;

// 한 달 중 내가 일기를 쓴 날짜(일). 예) month="2026-11", days=[1, 2, 3, 7]
public record DiaryCalendarResponse(String month, List<Integer> days) {
}
