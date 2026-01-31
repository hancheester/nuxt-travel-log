import type { DrizzleError } from "drizzle-orm";

import slugify from "slug";

import { findLocationByName, findUniqueSlug, insertLocation } from "~/lib/db/queries/location";
import { InsertLocation } from "~/lib/db/schema";
import defineAuthenticatedEventHandler from "~/utils/define-authenticated-event-handler";

export default defineAuthenticatedEventHandler(async (event) => {
  const result = await readValidatedBody(event, InsertLocation.safeParse);

  if (!result.success) {
    const statusMessage = result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");

    const data = result.error.issues.reduce((errors, issue) => {
      errors[issue.path.join(".")] = issue.message;
      return errors;
    }, {} as Record<string, string>);

    return sendError(event, createError({
      statusCode: 422,
      statusMessage,
      data,
    }));
  }

  const exisitingLocation = await findLocationByName(result.data, event.context.user.id);

  if (exisitingLocation) {
    return sendError(event, createError({
      statusCode: 409,
      statusMessage: "You already have a location with this name.",
    }));
  }

  const slug = await findUniqueSlug(slugify(result.data.name));

  try {
    return insertLocation(result.data, slug, event.context.user.id);
  }
  catch (e) {
    const error = e as DrizzleError;
    if ((error.cause as Error)?.message?.includes("UNIQUE constraint failed: location.slug")) {
      return sendError(event, createError({
        statusCode: 409,
        statusMessage: "Slug must be unique (the location name is used to generate the slug).",
      }));
    }
    throw error;
  }
});
