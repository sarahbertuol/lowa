import { createUserClient } from "./server";

/**
 * The signed-in user's client, only when that user is on the team (OE-16). A session alone is not
 * enough: someone taken off `team_members` keeps a valid session until it expires. Use this before
 * anything that runs with the service role (research, drafts, messages), which skips RLS.
 */
export async function teamClient() {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: team } = await supabase.rpc("is_team");
  return team === true ? supabase : null;
}
