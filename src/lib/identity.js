// Device identity for MVP anti-duplicate voting.
//
// KNOWN LIMITATION (deliberate): this is one-vote-per-BROWSER, not
// one-vote-per-PERSON. A random UUID in localStorage identifies the device;
// clearing storage or using another browser creates a new "voter".
// Real identity verification (one-person-one-vote) is an unsolved problem
// reserved for a later phase — see README.md → Roadmap.
const KEY = 'y-voter-id'

export function getVoterId() {
  let id = null
  try {
    id = localStorage.getItem(KEY)
  } catch {
    // storage unavailable (private mode etc.) — fall through to ephemeral id
  }
  if (!id) {
    id = crypto.randomUUID()
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // ephemeral id for this page load only
    }
  }
  return id
}
