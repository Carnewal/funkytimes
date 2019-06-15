const requestHandlerBase = url => {
  const doRequest = method => async (
    endpoint,
    { headers = {}, body, ...options } = {}
  ) => {
    const res = await fetch(`${url}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(options || {}),
    });
    const json = await res.json();
    return json;
  };
  return {
    get: doRequest('GET'),
    post: doRequest('POST'),
  };
};

const requestHandler = requestHandlerBase('https://wheat-week.glitch.me');

export default requestHandler;
