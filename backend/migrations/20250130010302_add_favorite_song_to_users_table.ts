import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.table('users', (table) => {
        table.string('favorite_song').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.table('users', (table) => {
        table.dropColumn('favorite_song');
    });
}

