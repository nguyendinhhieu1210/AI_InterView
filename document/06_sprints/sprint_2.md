# 🚀 Sprint 2 – Standard Interview

**Goal:** Hoàn thiện luồng phỏng vấn tiêu chuẩn (Chọn chủ đề → Chọn độ khó → AI sinh câu hỏi → Trả lời câu hỏi → AI chấm điểm và gợi ý cải thiện → Lưu kết quả).

---

## 1. Danh Sách User Stories

| ID | User Story | Story Points | Kết Quả | Chi Tiết Kỹ Thuật |
|---|---|---|---|---|
| **EP2-1** | Chọn chủ đề phỏng vấn | 3 | ✅ Hoàn thành | Giao diện `TopicSelection` cho phép người dùng lựa chọn các danh mục công nghệ phổ biến như JavaScript, React, Python, Java, v.v. |
| **EP2-2** | Chọn độ khó | 1 | ✅ Hoàn thành | Cho phép lựa chọn 3 mức độ: Easy (Dễ), Medium (Trung bình) và Hard (Khó) trước khi khởi tạo bài phỏng vấn. |
| **EP2-3** | AI sinh câu hỏi (7 MCQ + 3 Tự luận) | 8 | ✅ Hoàn thành | API `POST /api/interview/generate`. Sử dụng Groq SDK / Gemini sinh cấu trúc câu hỏi gồm **7 câu hỏi trắc nghiệm (MCQ)** và **3 câu hỏi tự luận (Essay)**. |
| **EP2-4** | Giao diện phòng phỏng vấn | 8 | ✅ Hoàn thành | Màn hình `InterviewPage` hiển thị danh sách câu hỏi, chia tab rõ ràng giữa MCQ và Essay, hỗ trợ lưu tạm tiến trình làm bài của user. |
| **EP2-5** | AI chấm điểm tự luận | 8 | ✅ Hoàn thành | API `POST /api/interview/submit`. Tự động tính điểm MCQ dựa trên đáp án đúng (10đ/câu). Gọi `gradeEssay` (AI Service) để chấm điểm tự luận và nhận phản hồi chi tiết từ AI. |
| **EP2-6** | Hiển thị kết quả | 5 | ✅ Hoàn thành | Sử dụng `InterviewReportModal` và giao diện kết quả sau submit để hiển thị breakdown điểm số, đáp án đúng kèm giải thích và phản hồi sửa lỗi của AI. |
| **EP2-7** | Lưu kết quả database | 3 | ✅ Hoàn thành | Lưu kết quả bài phỏng vấn vào collection `interviewresults` để phục vụ cho các trang lịch sử và biểu đồ thống kê. |

---

## 2. Luồng Nghiệp Vụ Chấm Điểm (Grading Flow)

```mermaid
flowchart TD
    Start([Bắt đầu submit]) --> CheckMCQ[Chấm MCQ - 7 câu]
    CheckMCQ --> GradeMCQ[Đúng: +10đ | Sai: +0đ]
    GradeMCQ --> CallAI[Gọi AI chấm Essay - 3 câu]
    CallAI --> GradeEssay[Đánh giá keywords & nội dung: 0 - 10đ/câu]
    GradeEssay --> CalcTotal[Tính tổng điểm: MCQ + Essay]
    CalcTotal --> SaveDB[Lưu vào Database]
    SaveDB --> ShowResult[Hiển thị kết quả lên Giao diện]
    ShowResult --> End([Kết thúc])
```

---

## 3. Retrospective Sprint 2

**Điểm tốt (What went well):**
- Cơ chế chia điểm trắc nghiệm (7 câu = 70đ) và tự luận (3 câu = 30đ) giúp bài thi có cơ cấu điểm chuẩn xác 100 điểm.
- API AI chấm tự luận phản hồi khá nhanh và chỉ ra đúng các keyword thiếu sót của người dùng.

**Cần cải thiện (To improve):**
- Thỉnh thoảng API AI sinh câu hỏi bị quá tải (Rate limit), cần viết thêm cơ chế fallback (câu hỏi mặc định lưu sẵn) để tránh lỗi trắng màn hình cho người dùng.
