import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth";

const handleAuthRequest = ({ request }: { request: Request }) => {
	if (new URL(request.url).pathname.replace(/\/$/, "") === "/api/auth") {
		return new Response("Better Auth endpoint not found", { status: 404 });
	}
	return auth.handler(request);
};

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: handleAuthRequest,
			POST: handleAuthRequest,
		},
	},
});
