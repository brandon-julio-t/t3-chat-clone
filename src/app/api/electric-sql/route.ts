import { env } from "~/env";
import { getSession } from "~/lib/auth";

export async function GET(req: Request) {
  const proxyUrl = new URL(req.url);

  // ... validate and authorize the request ...
  const auth = await getSession();
  if (!auth?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Construct the origin URL.
  const originUrl = new URL(env.ELECTRIC_SQL_BACKEND_URL);
  proxyUrl.searchParams.forEach((value, key) => {
    if (key === "where") {
      originUrl.searchParams.set(
        key,
        `${value} and "userId" = '${auth.user.id}'`,
      );
    } else {
      originUrl.searchParams.set(key, value);
    }
  });

  // Add the source params.
  originUrl.searchParams.set(`source_id`, env.ELECTRIC_SQL_SOURCE_ID);
  originUrl.searchParams.set(`secret`, env.ELECTRIC_SQL_SOURCE_SECRET);

  // Proxy the authorised request on to the Electric Cloud.
  const response = await fetch(originUrl);

  // Fetch decompresses the body but doesn't remove the
  // content-encoding & content-length headers which would
  // break decoding in the browser.
  //
  // See https://github.com/whatwg/fetch/issues/1729
  const headers = new Headers(response.headers);
  headers.delete(`content-encoding`);
  headers.delete(`content-length`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
