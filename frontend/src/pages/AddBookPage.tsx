import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createBook } from "../api/books";
import { apiError } from "../api/client";

export function AddBookPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => navigate("/books"),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate(
      {
        title: String(form.get("title")),
        author: String(form.get("author")),
        isbn: String(form.get("isbn")),
        description: String(form.get("description") || ""),
        totalCopies: Number(form.get("totalCopies")),
      },
      { onError: (e) => setError(apiError(e)) },
    );
  }
  return (
    <section>
      <h1>Add Book</h1>
      <form onSubmit={submit}>
        <label>
          Title
          <input name="title" required />
        </label>
        <label>
          Author
          <input name="author" required />
        </label>
        <label>
          ISBN
          <input name="isbn" required />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <label>
          Total copies
          <input name="totalCopies" type="number" min="1" required />
        </label>
        <button disabled={mutation.isPending}>Add book</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
