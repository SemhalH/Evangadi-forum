import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  LoaderCircle,
  CheckCircle,
} from "lucide-react";

import { questionService } from "../../services/question.service.js";
import styles from "./PostQuestion.module.css";

const INITIAL_FORM_DATA = {
  title: "",
  content: "",
};

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 255;
const MIN_CONTENT_LENGTH = 10;

function PostQuestion() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [publishedQuestion, setPublishedQuestion] = useState(null);

  // Validate one field at a time.
  function validateField(name, value) {
    const trimmedValue = value.trim();

    if (name === "title") {
      if (!trimmedValue) {
        return "Question title is required.";
      }

      if (trimmedValue.length < MIN_TITLE_LENGTH) {
        return `Question title must be at least ${MIN_TITLE_LENGTH} characters.`;
      }

      if (trimmedValue.length > MAX_TITLE_LENGTH) {
        return `Question title cannot exceed ${MAX_TITLE_LENGTH} characters.`;
      }
    }

    if (name === "content") {
      if (!trimmedValue) {
        return "Question content is required.";
      }

      if (trimmedValue.length < MIN_CONTENT_LENGTH) {
        return `Question content must be at least ${MIN_CONTENT_LENGTH} characters.`;
      }
    }

    return "";
  }

  // Validate both fields.
  function validateForm() {
    const errors = {
      title: validateField("title", formData.title),
      content: validateField("content", formData.content),
    };

    setFieldErrors(errors);

    return !errors.title && !errors.content;
  }

  // Update input values.
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");

    setFieldErrors((previousErrors) => ({
      ...previousErrors,
      [name]: validateField(name, value),
    }));
  }

  // Validate when the user leaves a field.
  function handleBlur(event) {
    const { name, value } = event.target;

    setFieldErrors((previousErrors) => ({
      ...previousErrors,
      [name]: validateField(name, value),
    }));
  }

  // Ask AI to review the question draft.
  async function handleGetFeedback() {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsCoaching(true);
    setCoachFeedback(null);

    try {
      const result = await questionService.generateQuestionDraftCoach({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });

      const feedbackData = result?.data ?? result;

      const tips = Array.isArray(feedbackData?.tips)
        ? feedbackData.tips
        : Array.isArray(feedbackData?.suggestions)
          ? feedbackData.suggestions
          : [];

      setCoachFeedback({
        feedback:
          feedbackData?.feedback ||
          feedbackData?.message ||
          feedbackData?.summary ||
          "Here is some feedback to help improve your question.",
        tips,
      });
    } catch (err) {
      setError(err.message || "Unable to get AI feedback.");
    } finally {
      setIsCoaching(false);
    }
  }

  // Submit question.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await questionService.createQuestion({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });

      const responseData = result?.data ?? result;
      const question = responseData?.question ?? responseData;

      // Save the created question identifier for the View Question button.
      const questionHash =
        question?.hash ??
        question?.question_hash ??
        question?.questionHash ??
        question?.slug ??
        question?.id ??
        null;

      setPublishedQuestion({
        hash: questionHash,
        title: formData.title.trim(),
      });
    } catch (err) {
      setError(err.message || "Unable to publish your question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reset the form to ask another question.
  function handleAskAnother() {
    setFormData(INITIAL_FORM_DATA);
    setFieldErrors({});
    setError("");
    setCoachFeedback(null);
    setPublishedQuestion(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Navigate to the published question.
  function handleViewQuestion() {
    if (publishedQuestion?.hash) {
      navigate(`/questions/${publishedQuestion.hash}`);
    } else {
      setError(
        "Your question was published, but the server did not return its question ID or hash.",
      );
    }
  }

  const isBusy = isSubmitting || isCoaching;

  // Show the success screen after successful publication.
  if (publishedQuestion) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.publishedCard}>
            <div className={styles.publishedIcon}>
              <CheckCircle size={27} />
            </div>

            <h1>Thread published</h1>

            <p>
              Your post is indexed for keyword search and embedding-based
              similarity. Share the link in study groups, or stay on the thread
              to answer follow-up questions from peers.
            </p>

            {error && (
              <div className={styles.apiError} role="alert">
                {error}
              </div>
            )}

            <div className={styles.publishedActions}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>

              <button
                type="button"
                className={styles.viewButton}
                onClick={handleViewQuestion}
              >
                View Question
              </button>

              <button
                type="button"
                className={styles.askAnotherButton}
                onClick={handleAskAnother}
              >
                Ask Another
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Page heading */}
        <div className={styles.pageHeading}>
          <span className={styles.eyebrow}>ASK THE COMMUNITY</span>

          <h1>Publish to the forum</h1>

          <p>
            Public threads help the whole cohort. Write as if a classmate will
            debug your issue tomorrow. They only know what you put on the page.
          </p>
        </div>

        {/* Writing instructions */}
        <section className={styles.guidelines}>
          <h2>Write questions people can answer in one pass</h2>

          <p>
            Mentors review title, time, OS, versions, commands, expected vs
            actual behavior, and a last step so they can reproduce the issue
            without guessing your setup.
          </p>

          <h3>Checklist before you post</h3>

          <ul>
            <li>
              <strong>Title as a headline:</strong> state the symptom and tech
              stack in one line.
            </li>

            <li>
              <strong>Environment mentioned:</strong> OS, browser, Node version,
              or framework.
            </li>

            <li>
              <strong>Minimal code:</strong> include the smallest reproducible
              example.
            </li>

            <li>
              <strong>Exact errors:</strong> include verbatim, including stack
              traces when debugging.
            </li>
          </ul>

          <h3>Validation rules enforced by the form</h3>

          <ul>
            <li>
              <strong>Title length:</strong> must be between 5 and 255
              characters.
            </li>

            <li>
              <strong>Body length:</strong> must contain a minimum of 10
              characters detailing your problem.
            </li>

            <li>
              <strong>Single topic:</strong> split unrelated topics into
              separate threads to search and embed easily.
            </li>
          </ul>
        </section>

        {/* Question form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className={styles.formGroup}>
            <label htmlFor="title">Title</label>

            <p className={styles.fieldDescription}>
              Be specific and imagine you're asking a question to another
              person.
            </p>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Enter your question title..."
              disabled={isBusy}
              className={fieldErrors.title ? styles.invalidInput : ""}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
            />

            {fieldErrors.title && (
              <p className={styles.fieldError} id="title-error">
                {fieldErrors.title}
              </p>
            )}
          </div>

          {/* Content */}
          <div className={styles.formGroup}>
            <label htmlFor="content">
              What are the details of your problem?
            </label>

            <p className={styles.fieldDescription}>
              Describe the problem and expected vs actual behavior. Minimum 10
              characters.
            </p>

            <div
              className={`${styles.editor} ${
                fieldErrors.content ? styles.invalidEditor : ""
              }`}
            >
              {/* Editor toolbar */}
              <div className={styles.toolbar}>
                <button
                  type="button"
                  aria-label="Bold"
                  title="Bold formatting"
                  disabled
                >
                  <Bold size={15} />
                </button>

                <button
                  type="button"
                  aria-label="Italic"
                  title="Italic formatting"
                  disabled
                >
                  <Italic size={15} />
                </button>

                <button
                  type="button"
                  aria-label="Insert link"
                  title="Insert link"
                  disabled
                >
                  <LinkIcon size={15} />
                </button>

                <button
                  type="button"
                  aria-label="Insert list"
                  title="Insert list"
                  disabled
                >
                  <List size={15} />
                </button>
              </div>

              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Describe your problem here..."
                rows={9}
                disabled={isBusy}
                aria-invalid={Boolean(fieldErrors.content)}
                aria-describedby={
                  fieldErrors.content ? "content-error" : undefined
                }
              />

              <div className={styles.editorFooter}>
                <span>{formData.content.trim().length} characters</span>
              </div>
            </div>

            {fieldErrors.content && (
              <p className={styles.fieldError} id="content-error">
                {fieldErrors.content}
              </p>
            )}
          </div>

          {/* AI feedback button */}
          <div className={styles.aiSection}>
            <button
              type="button"
              className={styles.aiButton}
              onClick={handleGetFeedback}
              disabled={isBusy}
            >
              {isCoaching ? (
                <>
                  <LoaderCircle className={styles.spinner} size={15} />
                  Getting suggestions...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  AI suggestions
                </>
              )}
            </button>

            <span>Suggestions only. You still choose what to post.</span>
          </div>

          {/* AI feedback panel */}
          {coachFeedback && (
            <section className={styles.feedbackPanel}>
              <h3>
                <Sparkles size={17} />
                AI Draft Coach
              </h3>

              <p>{coachFeedback.feedback}</p>

              {coachFeedback.tips.length > 0 && (
                <ul>
                  {coachFeedback.tips.map((tip, index) => (
                    <li key={index}>
                      {typeof tip === "string"
                        ? tip
                        : tip?.suggestion ||
                          tip?.description ||
                          tip?.message ||
                          tip?.title ||
                          JSON.stringify(tip)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* API error */}
          {error && (
            <div className={styles.apiError} role="alert">
              {error}
            </div>
          )}

          {/* Form actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate("/dashboard")}
              disabled={isBusy}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isBusy}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className={styles.spinner} size={15} />
                  Publishing...
                </>
              ) : (
                <>
                  Post Question
                  <Send size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default PostQuestion;
