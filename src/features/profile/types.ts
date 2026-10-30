/** The signed-in user's details from the profile endpoint (API_CONTRACT §4). */
export interface Profile {
  /** Backend uuid. */
  id: string;
  /** Human-readable employee ID such as "user00006". */
  employeeId: string | null;
  /** Null when the account has no name on record. */
  name: string | null;
  phone: string | null;
  imageUrl: string | null;
  age: number | null;
  /** As the admin typed it, e.g. "Male". */
  gender: string | null;
}
