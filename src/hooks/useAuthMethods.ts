import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

export function useAuthMethods() {
	const authMethods = useQuery(api.auth.getUserAuthMethods);

	return {
		hasPassword: authMethods?.hasPassword ?? false,
		hasOAuth: authMethods?.hasOAuth ?? false,
		oauthProviders: authMethods?.oauthProviders ?? [],
		accountLinked: authMethods?.accountLinked ?? false,
		isLoading: authMethods === undefined,
	};
}
