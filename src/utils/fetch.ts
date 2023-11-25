const maximumRetryCount = 3;
const retryDelay = 5000;

export default (input: NodeJS.fetch.RequestInfo | URL, init?: RequestInit | undefined): Promise<Response> => {
	let retryCount = 0;

	const fetchWithRetry = async (): Promise<Response> => {
		try {
			return await fetch(input, init);
		} catch (error) {
			if (retryCount < maximumRetryCount) {
				retryCount++;
				await new Promise((resolve) => setTimeout(resolve, retryDelay));
				return await fetchWithRetry();
			} else {
				throw error;
			}
		}
	};

	return fetchWithRetry();
};
