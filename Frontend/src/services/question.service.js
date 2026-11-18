import { apiClient } from "./core/api.client.js";

/**
 * Converts API errors into user-friendly messages.
 */
function handleQuestionError(error) {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return new Error("The request timed out. Please try again.");
    }

    return new Error(
      "Unable to connect to the server. Please check your connection.",
    );
  }

  const { status, data } = error.response;
  const message = data?.msg || data?.message;

  switch (status) {
    case 400:
      return new Error(message || "Please check your question details.");

    case 401:
      return new Error("Your session has expired. Please log in again.");

    case 500:
      return new Error("Something went wrong on the server. Please try again.");

    case 503:
      return new Error("The AI service is temporarily unavailable.");

    default:
      return new Error(message || "An unexpected error occurred.");
  }
}

/**
 * Gets AI feedback for a question draft.
 */
async function generateQuestionDraftCoach(draft) {
  try {
    const response = await apiClient.post("/api/questions/draft-coach", draft);

    // Supports both { data: {...} } and direct response objects.
    return response.data?.data ?? response.data;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Creates and submits a question.
 */
async function createQuestion(question) {
  try {
    const response = await apiClient.post("/api/questions", question);

    return response.data?.data ?? response.data;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

export const questionService = {
  generateQuestionDraftCoach,
  createQuestion,
};
