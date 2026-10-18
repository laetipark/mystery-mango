// Generated from the Java server OpenAPI schema. Run npm run generate:api to update.
export interface paths {
    "/api/v1/admin/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["reports"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scenario-reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_5"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scenario-reviews/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scenario-reviews/{id}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["decide"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scenarios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["scenarios"];
        put?: never;
        post: operations["create_4"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scenarios/{id}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scenarios/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["validate_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/assets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["download"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["csrf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/kakao": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["start_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/kakao/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["callback_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["providers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/assets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_2"];
        put?: never;
        post: operations["upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/assets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/sandboxes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_3"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/sandboxes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["sandbox"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/sandboxes/{id}/commands": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["sandboxCommand"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_4"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/versions/{versionId}/ending-observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/works": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_1"];
        put?: never;
        post: operations["create_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/works/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get"];
        put: operations["save"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/works/{id}/freeze": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["freeze"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/works/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/works/{id}/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["validate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/works/{id}/versions/{versionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getVersion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/author/works/{workId}/test-room": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{gameId}/voice-join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["join_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{gameId}/voice-state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["voice"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/abort-vote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["abort"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/ballots/{ballotId}/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["vote_1"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/board-commands": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["command"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/board-snapshot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["board"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/clue-shares": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["share"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/heartbeat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["heartbeat_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/investigations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["investigate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/kind": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["kind"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/leave": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["leaveGame"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/me/role": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["role"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["messages"];
        put?: never;
        post: operations["message"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/phase-ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ready_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/scene": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["scene"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/snapshot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["snapshot_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/whispers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["invite_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/whispers/{wid}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["accept_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/games/{id}/whispers/{wid}/leave": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["leave_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/match-proposals/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["proposal"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/match-proposals/{id}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/match-proposals/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/match-proposals/{id}/scenario-vote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["vote"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/match-tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["enqueue"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/match-tickets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ticket"];
        put?: never;
        post?: never;
        delete: operations["cancel"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["activity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/blocks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["blocks"];
        put?: never;
        post: operations["block"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/blocks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["unblock"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/discord": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["account"];
        put?: never;
        post?: never;
        delete: operations["unlink"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/discord/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["callback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/discord/link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["link"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["meta"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["report"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list"];
        put?: never;
        post: operations["create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["snapshot"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms/{id}/heartbeat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["heartbeat"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms/{id}/invite": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["invite"];
        delete: operations["revoke"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms/{id}/join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["join"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms/{id}/leave": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["leave"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms/{id}/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ready"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/rooms/{id}/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["start"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/scenarios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_3"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/scenarios/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Activity: {
            /** @enum {string} */
            kind: "IDLE" | "QUEUED" | "PROPOSED" | "ROOM" | "GAME";
            referenceId: string | null;
        };
        AuthorAsset: {
            /** Format: uuid */
            id: string;
            mimeType: string;
            name: string;
            /** Format: int32 */
            size: number;
        };
        AuthorTemplateList: {
            items: {
                blank: boolean;
                customizable: string[];
                description: string;
                /** @enum {string} */
                gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
                id: string;
                playerCounts: number[];
                rulesSummary: string;
                title: string;
            }[];
        };
        AuthorVersion: {
            authorRevision: number | null;
            document: components["schemas"]["EditorDocument"];
            reviewNote: string | null;
            reviewStatus: string | null;
            status: string;
            /** Format: int32 */
            version: number;
            /** Format: uuid */
            versionId: string;
            /** Format: uuid */
            workId: string;
        };
        AuthorWork: {
            document: components["schemas"]["EditorDocument"];
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            revision: number;
            /** Format: uuid */
            scenarioId: string;
            /** Format: date-time */
            updatedAt: string;
            versions: {
                /** Format: uuid */
                id: string;
                reviewNote: string | null;
                reviewStatus: string | null;
                status: string;
                /** Format: int32 */
                version: number;
            }[];
        };
        AuthorWorkList: {
            items: {
                /** @enum {string} */
                gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
                /** Format: uuid */
                id: string;
                /** Format: int32 */
                revision: number;
                status: string;
                title: string | null;
                /** Format: date-time */
                updatedAt: string;
            }[];
            /** Format: int32 */
            total: number;
        };
        AuthProviders: {
            kakaoConfigured: boolean;
            localLoginEnabled: boolean;
        };
        BallotView: {
            allowAbstain: boolean;
            allowChange: boolean;
            /** Format: date-time */
            endsAt: string;
            /** Format: uuid */
            id: string;
            myVote: string | null;
            submitted: boolean;
        };
        Block: {
            /** Format: uuid */
            userId?: string;
        };
        BoardCommand: {
            /** Format: int64 */
            expectedVersion?: number;
            payload?: {
                [key: string]: unknown;
            };
            type?: string;
        };
        BoardSnapshot: {
            /** Format: int32 */
            abortRequired: number;
            /** Format: int32 */
            abortVotes: number;
            availableScenes: {
                id: string;
                name: string;
            }[];
            canChangeScene: boolean;
            canRequestAbort: boolean;
            /** @enum {string} */
            gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            /** Format: uuid */
            hostId: string;
            /** Format: uuid */
            id: string;
            layouts: components["schemas"]["SceneView"][];
            /** Format: int32 */
            mySeat: number;
            participants: {
                active: boolean;
                displayName: string;
                /** Format: int32 */
                seat: number;
                /** Format: uuid */
                userId: string;
            }[];
            /** @enum {string} */
            resultKind: "MANUAL" | "AUTOMATIC";
            scene: components["schemas"]["SceneView"] | null;
            /** Format: date-time */
            serverTime: string;
            state: components["schemas"]["YachtState"] | components["schemas"]["TableState"] | components["schemas"]["ClassicState"];
            /** Format: int32 */
            stateVersion: number;
            status: string;
        };
        CardFaceDesign: {
            background: string;
            height: number;
            nodes: components["schemas"]["CardVisualNode"][];
            width: number;
        };
        CardVisualNode: {
            /** Format: uuid */
            assetId?: string;
            fill?: string;
            fontSize?: number;
            height: number;
            /** @enum {string} */
            kind: "TEXT" | "IMAGE" | "RECT" | "ELLIPSE";
            rotation: number;
            text?: string;
            width: number;
            x: number;
            y: number;
        };
        ChatMessage: {
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            senderId: string;
            senderName: string;
            text: string;
            whisperId: string | null;
        };
        ClassicAppearance: {
            boardColor?: string;
            darkSquareColor?: string;
            firstPieceColor?: string;
            lightSquareColor?: string;
            secondPieceColor?: string;
        };
        ClassicMove: {
            /** Format: int32 */
            col: number;
            /** Format: int32 */
            fromCol?: number;
            /** Format: int32 */
            fromRow?: number;
            /** Format: int32 */
            row: number;
        };
        ClassicState: {
            activeSeats: number[];
            appearance: components["schemas"]["ClassicAppearance"];
            board: number[][];
            counts: number[];
            draw: boolean;
            endReason: string | null;
            finished: boolean;
            forcedFrom: {
                /** Format: int32 */
                col: number;
                /** Format: int32 */
                row: number;
            } | null;
            legalMoves: components["schemas"]["ClassicMove"][];
            /** Format: int32 */
            turnSeat: number;
            winners: number[];
        };
        ClueView: {
            id: string;
            owned: boolean;
            public: boolean;
            /** @enum {string} */
            sharePolicy: "PRIVATE" | "PUBLIC" | "PUBLIC_AND_WHISPER";
            text: string;
            title: string;
        };
        Create: {
            /** Format: int32 */
            capacity?: number;
            inviteToken?: string;
            mode?: string;
            /** Format: uuid */
            scenarioVersionId?: string;
            visibility?: string;
        };
        CsrfResponse: {
            headerName: string;
            token: string;
        };
        Decision: {
            decision?: string;
            note?: string;
        };
        Definition: {
            definition?: {
                [key: string]: unknown;
            };
        };
        EditorCardFace: {
            background?: string;
            nodes?: components["schemas"]["EditorCardNode"][];
        };
        EditorCardLayout: {
            back?: components["schemas"]["EditorCardFace"];
            front?: components["schemas"]["EditorCardFace"];
            height?: number;
            id?: string;
            name?: string;
            width?: number;
        };
        EditorCardNode: {
            assetId?: string | null;
            fill?: string;
            fontSize?: number;
            height?: number;
            hidden?: boolean;
            id?: string;
            /** @enum {string} */
            kind?: "TEXT" | "IMAGE" | "RECT" | "ELLIPSE";
            locked?: boolean;
            rotation?: number;
            text?: string;
            width?: number;
            x?: number;
            y?: number;
        };
        EditorCondition: {
            clueId?: string;
            condition?: components["schemas"]["EditorCondition"];
            conditions?: components["schemas"]["EditorCondition"][];
            flag?: string;
            roleId?: string;
            type?: string;
            value?: string | boolean | number;
        };
        EditorDocument: {
            ballot?: {
                allowAbstain?: boolean;
                allowChange?: boolean;
                culpritRoleId?: string;
                tiePolicy?: string;
            };
            classic?: components["schemas"]["ClassicAppearance"];
            clues?: {
                id?: string;
                sharePolicy?: string;
                text?: string;
                title?: string;
            }[];
            difficulty?: string;
            endings?: {
                condition?: components["schemas"]["EditorCondition"];
                id?: string;
                text?: string;
                title?: string;
            }[];
            engineId?: string;
            /** Format: int32 */
            estimatedMinutes?: number;
            /** @enum {string} */
            gameType?: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            genre?: string;
            language?: string;
            modes?: string[];
            phases?: {
                actions?: string[];
                /** Format: int32 */
                durationSeconds?: number;
                id?: string;
                /** Format: int32 */
                investigationLimit?: number;
                kind?: string;
                publicText?: string;
            }[];
            /** Format: int32 */
            playerCount?: number;
            presentation?: {
                cardLayouts?: components["schemas"]["EditorCardLayout"][];
                scenes?: components["schemas"]["EditorScene"][];
            };
            roles?: {
                id?: string;
                name?: string;
                objective?: {
                    condition?: components["schemas"]["EditorCondition"];
                    text?: string;
                };
                publicIntro?: string;
                secret?: string;
            }[];
            rules?: {
                clueId?: string;
                condition?: components["schemas"]["EditorCondition"];
                effects?: {
                    clueId?: string;
                    flag?: string;
                    roleId?: string;
                    text?: string;
                    type?: string;
                    value?: string | boolean | number;
                }[];
                id?: string;
                phaseId?: string;
                when?: string;
            }[];
            /** Format: int32 */
            schemaVersion?: number;
            slug?: string;
            supportedPlayerCounts?: number[];
            synopsis?: string;
            tabletop?: {
                decks?: {
                    backAssetId?: string | null;
                    backLayoutId?: string | null;
                    cards?: {
                        assetId?: string | null;
                        id?: string;
                        layoutId?: string | null;
                        name?: string;
                        text?: string;
                    }[];
                    id?: string;
                    name?: string;
                    x?: number;
                    y?: number;
                }[];
                objects?: components["schemas"]["EditorTablePiece"][];
            };
            targets?: {
                clueIds?: string[];
                id?: string;
                name?: string;
                phaseIds?: string[];
            }[];
            title?: string;
            yacht?: components["schemas"]["YachtAppearance"];
        };
        EditorNode: {
            assetId?: string | null;
            bindingId?: string;
            /** @enum {string} */
            bindingType?: "NONE" | "ROLE" | "CLUE" | "TARGET";
            fill?: string;
            fontSize?: number;
            height?: number;
            hidden?: boolean;
            id?: string;
            /** @enum {string} */
            kind?: "TEXT" | "IMAGE" | "RECT" | "ELLIPSE" | "MATERIAL";
            locked?: boolean;
            rotation?: number;
            text?: string;
            width?: number;
            x?: number;
            y?: number;
        };
        EditorScene: {
            background?: string;
            bgmAssetId?: string | null;
            height?: number;
            id?: string;
            /** @enum {string} */
            kind?: "SCENE" | "ROLE" | "CLUE";
            name?: string;
            nodes?: components["schemas"]["EditorNode"][];
            phaseIds?: string[];
            referenceId?: string;
            width?: number;
        };
        EditorTablePiece: {
            assetId?: string | null;
            backAssetId?: string | null;
            faceUp?: boolean;
            height?: number;
            id?: string;
            /** @enum {string} */
            kind?: "CARD" | "TOKEN" | "DICE" | "COUNTER";
            layoutId?: string | null;
            locked?: boolean;
            name?: string;
            /** Format: int32 */
            sides?: number;
            text?: string;
            /** Format: int32 */
            value?: number;
            width?: number;
            x?: number;
            y?: number;
        };
        EndingObservations: {
            authorRevision: number | null;
            endings: {
                authorReachedAt: string | null;
                endingId: string;
                invitedTestReachedAt: string | null;
                reviewerReachedAt: string | null;
                title: string;
            }[];
            /** Format: int32 */
            reachedEndings: number;
            /** Format: int32 */
            totalEndings: number;
            /** Format: uuid */
            versionId: string;
        };
        ErrorResponse: {
            code: string;
            message: string;
            traceId: string;
        };
        GameSnapshot: {
            /** Format: int32 */
            abortRequired: number;
            /** Format: int32 */
            abortVotes: number;
            availableScenes: {
                id: string;
                name: string;
            }[];
            ballot: components["schemas"]["BallotView"] | null;
            canChangeScene: boolean;
            canRequestAbort: boolean;
            clues: components["schemas"]["ClueView"][];
            ending: {
                objectiveAchieved: boolean;
                text: string;
                title: string;
            } | null;
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            investigationsRemaining: number;
            layouts: components["schemas"]["SceneView"][];
            materials: {
                /** Format: uuid */
                id: string;
                text: string;
            }[];
            myRole: components["schemas"]["PrivateRole"];
            participants: {
                active: boolean;
                connected: boolean;
                displayName: string;
                roleId: string;
                roleName: string;
                /** Format: uuid */
                userId: string;
            }[];
            phase: components["schemas"]["PhaseView"];
            scene: components["schemas"]["SceneView"] | null;
            /** Format: date-time */
            serverTime: string;
            /** Format: int32 */
            stateVersion: number;
            /** @enum {string} */
            status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ABORTED";
            targets: {
                id: string;
                investigated: boolean;
                name: string;
            }[];
            whispers: {
                /** Format: uuid */
                id: string;
                /** Format: uuid */
                inviteeId: string;
                /** Format: uuid */
                inviterId: string;
                /** @enum {string} */
                status: "INVITED" | "ACTIVE" | "CLOSED";
            }[];
        };
        Invite: {
            inviteToken?: string;
        };
        Join: {
            inviteToken?: string;
        };
        KakaoAuthorize: {
            authorizeUrl: string;
        };
        KakaoStart: {
            next?: string;
        };
        Login: {
            /** Format: email */
            email: string;
            password: string;
        };
        MatchProposal: {
            candidates: {
                difficulty: string;
                durationEstimated: boolean;
                engineId: string;
                /** Format: int32 */
                estimatedMinutes: number;
                /** @enum {string} */
                gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
                genre: string;
                /** Format: uuid */
                id: string;
                language: string;
                modes: ("TEXT" | "DISCORD")[];
                /** Format: int32 */
                playerCount: number;
                /** Format: int32 */
                rank: number;
                roles: {
                    id: string;
                    name: string;
                    publicIntro: string;
                }[];
                supportedPlayerCounts: number[];
                synopsis: string;
                title: string;
                /** Format: uuid */
                versionId: string;
            }[];
            /** Format: int32 */
            capacity: number;
            /** Format: date-time */
            expiresAt: string;
            /** @enum {string} */
            gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            /** Format: uuid */
            id: string;
            members: {
                accepted: boolean;
                displayName: string;
                /** Format: uuid */
                userId: string;
            }[];
            myVote: string | null;
            roomId: string | null;
            scenarioVersionId: string | null;
            /** @enum {string} */
            status: "ACCEPTING" | "VOTING" | "ROOM" | "ENDED";
        };
        MysterySandboxState: {
            ballot: {
                allowAbstain: boolean;
                allowChange: boolean;
                myVote: string | null;
                submitted: boolean;
            } | null;
            clues: components["schemas"]["ClueView"][];
            ending: {
                objectiveAchieved: boolean;
                text: string;
                title: string;
            } | null;
            /** Format: int32 */
            investigationsRemaining: number;
            materials: {
                /** Format: uuid */
                id: string;
                text: string;
            }[];
            myRole: components["schemas"]["PrivateRole"];
            participants: {
                roleId: string;
                roleName: string;
            }[];
            phase: {
                actions: string[];
                definitionId: string;
                kind: string;
                publicText: string;
                ready: boolean;
            };
            /** Format: int32 */
            phaseIndex: number;
            status: string;
            targets: {
                id: string;
                investigated: boolean;
                name: string;
            }[];
        };
        PhaseView: {
            actions: string[];
            definitionId: string;
            /** Format: date-time */
            endsAt: string;
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            kind: "READING" | "INVESTIGATION" | "DISCUSSION" | "VOTE" | "ENDING";
            publicText: string;
            ready: boolean;
        };
        PlayHistoryEntry: {
            completedAt: string | null;
            /** Format: uuid */
            gameId: string;
            /** @enum {string} */
            status: "COMPLETED" | "ABORTED";
            title: string;
        };
        PrivateRole: {
            id: string;
            name: string;
            objective: string;
            secret: string;
        };
        Ready: {
            ready?: boolean;
        };
        Register: {
            displayName: string;
            /** Format: email */
            email: string;
            password: string;
        };
        Report: {
            /** Format: uuid */
            gameId?: string;
            /** Format: uuid */
            messageId?: string;
            reason?: string;
            /** Format: uuid */
            targetUserId?: string;
        };
        ReviewDetail: {
            document: components["schemas"]["EditorDocument"];
            /** Format: uuid */
            id: string;
            note: string;
            status: string;
            /** Format: uuid */
            versionId: string;
        };
        ReviewList: {
            items: {
                authorName: string;
                /** Format: date-time */
                createdAt: string;
                /** Format: uuid */
                id: string;
                status: string;
                title: string;
                /** Format: uuid */
                versionId: string;
            }[];
            /** Format: int32 */
            total: number;
        };
        Revision: {
            /** Format: int64 */
            revision?: number;
        };
        RoomCard: {
            /** Format: int32 */
            capacity: number;
            /** Format: int32 */
            count: number;
            /** @enum {string} */
            gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            hostName: string;
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            mode: "TEXT" | "DISCORD";
            /** Format: uuid */
            scenarioVersionId: string;
            title: string;
        };
        RoomSnapshot: {
            /** Format: int32 */
            capacity: number;
            gameId: string | null;
            /** @enum {string} */
            gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            /** Format: uuid */
            hostId: string;
            /** Format: uuid */
            id: string;
            isTest: boolean;
            /** @enum {string} */
            mode: "TEXT" | "DISCORD";
            participants: {
                connected: boolean;
                displayName: string;
                ready: boolean;
                /** Format: uuid */
                userId: string;
            }[];
            rules: string;
            /** Format: uuid */
            scenarioVersionId: string;
            /** @enum {string} */
            status: "WAITING" | "PLAYING" | "CLOSED";
            title: string;
            /** @enum {string} */
            visibility: "PUBLIC" | "INVITE";
        };
        SandboxCommand: {
            /** Format: int64 */
            expectedVersion?: number;
            payload?: {
                [key: string]: unknown;
            };
            /** Format: int32 */
            seat?: number;
            type?: string;
        };
        SandboxCreate: {
            /** Format: int32 */
            capacity?: number;
            /** Format: uuid */
            versionId?: string;
        };
        SandboxSnapshot: {
            availableScenes: {
                id: string;
                name: string;
            }[];
            canChangeScene: boolean;
            /** Format: int32 */
            capacity: number;
            /** @enum {string} */
            gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            /** Format: uuid */
            id: string;
            layouts: components["schemas"]["SceneView"][];
            scene: components["schemas"]["SceneView"] | null;
            /** Format: int32 */
            seat: number;
            state: components["schemas"]["YachtState"] | components["schemas"]["TableState"] | components["schemas"]["ClassicState"] | components["schemas"]["MysterySandboxState"];
            /** Format: int32 */
            stateVersion: number;
        };
        Save: {
            document?: {
                [key: string]: unknown;
            };
            /** Format: int64 */
            revision?: number;
        };
        ScenarioCard: {
            difficulty: string;
            durationEstimated: boolean;
            engineId: string;
            /** Format: int32 */
            estimatedMinutes: number;
            /** @enum {string} */
            gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            genre: string;
            /** Format: uuid */
            id: string;
            language: string;
            modes: ("TEXT" | "DISCORD")[];
            /** Format: int32 */
            playerCount: number;
            roles: {
                id: string;
                name: string;
                publicIntro: string;
            }[];
            supportedPlayerCounts: number[];
            synopsis: string;
            title: string;
            /** Format: uuid */
            versionId: string;
        };
        SceneChange: {
            sceneId?: string;
        };
        SceneView: {
            background: string;
            bgmAssetId: string | null;
            height: number;
            id: string;
            name: string;
            nodes: components["schemas"]["EditorNode"][];
            width: number;
        };
        ServerEvent: {
            /** Format: uuid */
            eventId: string;
            gameId: string | null;
            /** Format: date-time */
            serverTime: string;
            /** Format: int32 */
            stateVersion: number;
            type: string;
        };
        TablePiece: {
            assetId?: string | null;
            backAssetId?: string | null;
            faceDesign?: components["schemas"]["CardFaceDesign"];
            faceUp?: boolean;
            height?: number;
            id?: string;
            /** @enum {string} */
            kind?: "CARD" | "TOKEN" | "DICE" | "COUNTER";
            locked?: boolean;
            name?: string;
            ownerSeat?: number | null;
            /** Format: int32 */
            sides?: number;
            text?: string;
            /** Format: int32 */
            value?: number;
            width?: number;
            x?: number;
            y?: number;
        };
        TableState: {
            activeSeats: number[];
            decks: {
                backAssetId?: string | null;
                backDesign?: components["schemas"]["CardFaceDesign"];
                /** Format: int32 */
                count: number;
                id: string;
                name: string;
                x: number;
                y: number;
            }[];
            finished: boolean;
            hands: {
                /** Format: int32 */
                count: number;
                /** Format: int32 */
                seat: number;
            }[];
            objects: components["schemas"]["TablePiece"][];
            /** Format: int32 */
            turnSeat: number;
        };
        TicketRequest: {
            /** Format: int32 */
            capacity?: number;
            difficulty?: string;
            gameType?: string;
            genre?: string;
            language?: string;
            /** Format: int32 */
            maxMinutes?: number;
            mode?: string;
            requeue?: boolean;
            /** Format: uuid */
            scenarioVersionId?: string;
        };
        TicketView: {
            /** Format: int32 */
            capacity: number;
            difficulty: string | null;
            /** @enum {string} */
            gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
            genre: string | null;
            /** Format: uuid */
            id: string;
            language: string;
            /** Format: int32 */
            maxMinutes: number;
            /** @enum {string} */
            mode: "TEXT" | "DISCORD";
            proposalId: string | null;
            /** Format: date-time */
            queuedAt: string;
            requeue: boolean;
            scenarioVersionId: string | null;
            /** @enum {string} */
            status: "WAITING" | "PROPOSED" | "CANCELLED" | "ROOM";
        };
        UserView: {
            admin: boolean;
            displayName: string;
            email: string | null;
            /** Format: uuid */
            id: string;
        };
        Validate: {
            /** Format: int64 */
            revision?: number;
        };
        ValidationResult: {
            issues: {
                code: string;
                message: string;
                path: string;
                /** @enum {string} */
                severity: "ERROR" | "WARNING";
            }[];
            /** Format: int32 */
            revision: number;
            truncated: boolean;
            valid: boolean;
        };
        Vote: {
            /** Format: uuid */
            scenarioVersionId?: string;
        };
        YachtAppearance: {
            diceColor?: string;
            pipColor?: string;
            scoreboardColor?: string;
        };
        YachtState: {
            activeSeats: number[];
            appearance: components["schemas"]["YachtAppearance"];
            availableScores: {
                [key: string]: number;
            };
            dice: number[];
            finished: boolean;
            held: boolean[];
            /** Format: int32 */
            rollsRemaining: number;
            scores: {
                /** Format: int32 */
                bonus?: number;
                categories?: {
                    [key: string]: number;
                };
                forfeited?: boolean;
                rank?: number | null;
                /** Format: int32 */
                seat?: number;
                /** Format: int32 */
                total?: number;
                /** Format: int32 */
                upperTotal?: number;
            }[];
            /** Format: int32 */
            turnSeat: number;
            winners: number[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    reports: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_5: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewList"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewDetail"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    decide: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    decision: "APPROVE" | "REQUEST_CHANGES";
                    note: string;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    scenarios: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_4: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Definition"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    publish: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    validate_1: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Definition"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    download: {
        parameters: {
            query?: {
                gameId?: string;
                sandboxId?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 문맥별 열람 권한을 검사한 원본 파일. 공유 캐시 금지. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    csrf: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CsrfResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    start_1: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    next?: string;
                };
            };
        };
        responses: {
            /** @description 카카오 인가 페이지 주소. 로그인한 세션에서는 계정 전환을 거부합니다. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KakaoAuthorize"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    callback_1: {
        parameters: {
            query?: {
                code?: string;
                error?: string;
                state?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 로그인 후 검증된 같은 사이트 경로로 이동합니다. 실패 시 /login?kakaoError=cancelled|expired|failed|unavailable 로 이동합니다. */
            302: {
                headers: {
                    Location?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    login: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Login"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserView"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 세션과 연결을 종료합니다. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserView"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    providers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthProviders"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    register: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Register"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UserView"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["AuthorAsset"][];
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    upload: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorAsset"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_3: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    capacity: number;
                    /** Format: uuid */
                    versionId: string;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    sandbox: {
        parameters: {
            query?: {
                seat?: number;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SandboxSnapshot"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    sandboxCommand: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    expectedVersion: number;
                    payload: {
                        category?: string;
                        clueId?: string;
                        /** Format: int32 */
                        col?: number;
                        deckId?: string;
                        /** Format: int32 */
                        fromCol?: number;
                        /** Format: int32 */
                        fromRow?: number;
                        indices?: number[];
                        objectId?: string;
                        roleId?: string | null;
                        /** Format: int32 */
                        row?: number;
                        sceneId?: string;
                        scope?: string;
                        targetId?: string;
                        /** Format: int32 */
                        toCol?: number;
                        /** Format: int32 */
                        toRow?: number;
                        toSeat?: number | null;
                        /** Format: int32 */
                        value?: number;
                        x?: number;
                        y?: number;
                    };
                    /** Format: int32 */
                    seat: number;
                    type: string;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_4: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorTemplateList"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                versionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EndingObservations"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorWorkList"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_1: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    gameType?: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
                    templateId?: string;
                    title: string;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorWork"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    save: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    document: components["schemas"]["EditorDocument"];
                    /** Format: int32 */
                    revision: number;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: int32 */
                        revision: number;
                        /** Format: date-time */
                        updatedAt: string;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    freeze: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    revision: number;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        versionId: string;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    submit: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    revision: number;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        reviewId: string;
                        /** Format: uuid */
                        versionId: string;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    validate: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    revision: number;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationResult"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getVersion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                versionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthorVersion"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_2: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                workId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    capacity: number;
                    inviteToken: string;
                    /** @enum {string} */
                    mode: "TEXT" | "DISCORD";
                    /** Format: uuid */
                    versionId: string;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        expiresAt: string;
                        /** Format: uuid */
                        roomId: string;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    join_1: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                gameId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    voice: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                gameId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    abort: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    vote_1: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                ballotId: string;
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    roleId: string | null;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    command: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    expectedVersion: number;
                    payload: {
                        category?: string;
                        clueId?: string;
                        /** Format: int32 */
                        col?: number;
                        deckId?: string;
                        /** Format: int32 */
                        fromCol?: number;
                        /** Format: int32 */
                        fromRow?: number;
                        indices?: number[];
                        objectId?: string;
                        roleId?: string | null;
                        /** Format: int32 */
                        row?: number;
                        sceneId?: string;
                        scope?: string;
                        targetId?: string;
                        /** Format: int32 */
                        toCol?: number;
                        /** Format: int32 */
                        toRow?: number;
                        toSeat?: number | null;
                        /** Format: int32 */
                        value?: number;
                        x?: number;
                        y?: number;
                    };
                    type: string;
                };
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    board: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BoardSnapshot"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    share: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    clueId: string;
                    /** @enum {string} */
                    scope: "PUBLIC" | "WHISPER";
                    whisperId?: string | null;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    heartbeat_1: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    investigate: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    targetId: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    kind: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {string} */
                        gameType: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
                        test: boolean;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    leaveGame: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    role: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PrivateRole"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    messages: {
        parameters: {
            query?: {
                before?: string;
                size?: number;
                whisperId?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        hasMore: boolean;
                        items: components["schemas"]["ChatMessage"][];
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    message: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    text: string;
                    whisperId?: string | null;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    ready_1: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    scene: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SceneChange"];
            };
        };
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ok: boolean;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    snapshot_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GameSnapshot"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    invite_1: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    inviteeId: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    accept_1: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
                wid: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    leave_1: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
                wid: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    proposal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MatchProposal"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    accept: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reject: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    vote: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Vote"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    enqueue: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: int32 */
                    capacity?: number;
                    difficulty?: string | null;
                    /** @enum {string} */
                    gameType?: "MURDER_MYSTERY" | "TABLETOP" | "YACHT" | "GOMOKU" | "REVERSI" | "CHECKERS";
                    genre?: string | null;
                    language: string;
                    /** Format: int32 */
                    maxMinutes: number;
                    /** @enum {string} */
                    mode: "TEXT" | "DISCORD";
                    requeue: boolean;
                    scenarioVersionId?: string | null;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    ticket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketView"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    cancel: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    activity: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Activity"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    blocks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    block: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Block"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    unblock: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    account: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    unlink: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    callback: {
        parameters: {
            query?: {
                code?: string;
                state?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    link: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    history: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["PlayHistoryEntry"][];
                        /** Format: int32 */
                        page: number;
                        /** Format: int32 */
                        size: number;
                        /** Format: int32 */
                        total: number;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    meta: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    report: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Report"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list: {
        parameters: {
            query?: {
                page?: number;
                scenarioId?: string;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["RoomCard"][];
                        /** Format: int32 */
                        page: number;
                        /** Format: int32 */
                        size: number;
                        /** Format: int32 */
                        total: number;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    capacity?: number | null;
                    inviteToken?: string | null;
                    /** @enum {string} */
                    mode: "TEXT" | "DISCORD";
                    /** Format: uuid */
                    scenarioVersionId: string;
                    /** @enum {string} */
                    visibility: "PUBLIC" | "INVITE";
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    snapshot: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoomSnapshot"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    heartbeat: {
        parameters: {
            query?: never;
            header: {
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    invite: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Invite"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    revoke: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    join: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["Join"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    leave: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    ready: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Ready"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    start: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                /** @description GET /api/v1/auth/csrf에서 받은 현재 세션 토큰 */
                "X-CSRF-TOKEN": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_3: {
        parameters: {
            query?: {
                difficulty?: string;
                gameType?: string;
                genre?: string;
                maxMinutes?: number;
                page?: number;
                playerCount?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["ScenarioCard"][];
                        /** Format: int32 */
                        page: number;
                        /** Format: int32 */
                        size: number;
                        /** Format: int32 */
                        total: number;
                    };
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 성공 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScenarioCard"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description 안정적인 오류 코드와 한국어 메시지 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
