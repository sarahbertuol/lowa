"use client";

import { clearOfflineData } from "./ServiceWorker";

/** Sign out: first clears the offline copies, then posts to the sign-out route. */
export default function SignOut() {
  return (
    <form
      action="/discover/auth/signout"
      method="post"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        await clearOfflineData().catch(() => {});
        form.submit();
      }}
    >
      <button className="dx-btn small ghost" type="submit">Sign out</button>
    </form>
  );
}
