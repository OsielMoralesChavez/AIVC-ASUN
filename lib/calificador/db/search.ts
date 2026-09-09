/** Solo el tipo — ver la nota en ./queue.ts. */
export interface SearchResult {
  submission_id: string;
  student_names: string;
  subject_id: string;
  subject_name: string;
  session_id: string;
  session_name: string;
  session_status: string;
  final_grade: number | null;
  was_edited: boolean;
  graded_at: string | null;
}
