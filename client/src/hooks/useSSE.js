
import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export function useSSE(url, onMessage) {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    const controller = new AbortController();

    async function connect() {
      try {
        const response = await fetch(
          `http://localhost:3001${url}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `SSE connection failed: ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("SSE response body is missing");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const line = event
              .split("\n")
              .find((item) => item.startsWith("data:"));

            if (!line) {
              continue;
            }

            try {
              const data = JSON.parse(line.slice(5).trim());
              onMessage(data);
            } catch (error) {
              console.error("SSE message error:", error);
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("SSE connection error:", error);
        }
      }
    }

    connect();

    return () => {
      controller.abort();
    };
  }, [url, user, token, onMessage]);
}
