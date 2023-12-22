import axios from "axios";

async function* pageThroughIssues(endpoint: string, auth: any) {
  async function* makeRequest(_endpoint: string): AsyncGenerator<any> {
    const response = await axios({
      url: _endpoint,
      method: "get",
      auth: auth,
    });

    if (response.status !== 200) {
      throw new Error(await response.statusText);
    }

    const page = await response.data;

    yield page;

    if (page.issues.length) {
      const url: string = `${endpoint}&startAt=${page.startAt + 100}`;
      yield* makeRequest(url);
    }
  }

  yield* makeRequest(endpoint);
}

export async function* loadIssues(url: any, auth: any) {
  const endpoint = url;
  const result = pageThroughIssues(endpoint, auth);

  for await (const page of result) {
    for (const issue of page.issues) {
      yield issue;
    }
  }
}

async function* pageThroughComments(endpoint: any, auth: any) {
  async function* makeRequest(_endpoint: string): AsyncGenerator<any> {
    const response = await axios({
      url: _endpoint,
      method: "get",
      auth: auth,
    });

    if (response.status !== 200) {
      throw new Error(await response.statusText);
    }

    const page = await response.data;

    yield page;

    if (page.comments.length) {
      const url: string = `${endpoint}&startAt=${page.startAt + 100}`;
      yield* makeRequest(url);
    }
  }

  yield* makeRequest(endpoint);
}

export async function* loadComments(url: any, auth: any) {
  const endpoint = url;
  const result = pageThroughComments(endpoint, auth);

  for await (const page of result) {
    for (const comment of page.comments) {
      yield comment;
    }
  }
}
