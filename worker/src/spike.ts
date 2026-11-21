import typia, { tags } from "typia";

export interface CreateEvent {
  readonly name: string & tags.MinLength<1> & tags.MaxLength<80>;
  readonly participants: ReadonlyArray<string & tags.MinLength<1>> &
    tags.MinItems<3> &
    tags.MaxItems<50>;
}

export const validateCreateEvent = typia.createValidate<CreateEvent>();
