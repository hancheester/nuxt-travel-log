import type { DrizzleError } from "drizzle-orm";

import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import slugify from "slug";

import db from "~/lib/db";
import { InsertLocation, location } from "~/lib/db/schema";

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    return sendError(event, createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    }));
  }

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

  const exisitingLocation = await db.query.location.findFirst({
    where:
      and (
        eq(location.name, result.data.name),
        eq(location.userId, event.context.user.id),
      ),
  });

  if (exisitingLocation) {
    return sendError(event, createError({
      statusCode: 409,
      statusMessage: "You already have a location with this name.",
    }));
  }

  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 5);

  let slug = slugify(result.data.name);
  let existing = !!(await db.query.location.findFirst({
    where: eq(location.slug, slug),
  }));

  while (existing) {
    const id = nanoid();
    const idSlug = `${slug}-${id}`;
    existing = !!(await db.query.location.findFirst({
      where: eq(location.slug, idSlug),
    }));

    if (!existing) {
      slug = idSlug;
      break;
    }
  }

  try {
    const [created] = await db.insert(location).values({
      userId: event.context.user.id,
      slug,
      ...result.data,
    }).returning();
    return created;
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
