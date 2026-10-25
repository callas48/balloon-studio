import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const visits=sqliteTable('analytics_visits',{day:text('day').notNull(),visitor:text('visitor').notNull(),lastSeen:integer('last_seen').notNull()},t=>[primaryKey({columns:[t.day,t.visitor]})]);
export const days=sqliteTable('analytics_days',{day:text('day').primaryKey(),views:integer('views').notNull().default(0)});

export const sharedAssets=sqliteTable('shared_assets',{id:text('id').primaryKey(),name:text('name').notNull(),width:integer('width').notNull(),height:integer('height').notNull(),createdAt:integer('created_at').notNull()});
