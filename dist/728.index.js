export const id = 728;
export const ids = [728];
export const modules = {

/***/ 985:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BidiServer = void 0;
const EventEmitter_js_1 = __webpack_require__(6111);
const processingQueue_js_1 = __webpack_require__(9300);
const EventManager_js_1 = __webpack_require__(8701);
const CommandProcessor_js_1 = __webpack_require__(7002);
const browsingContextStorage_js_1 = __webpack_require__(7652);
class BidiServer extends EventEmitter_js_1.EventEmitter {
    #messageQueue;
    #transport;
    #commandProcessor;
    constructor(bidiTransport, cdpConnection, selfTargetId, parser) {
        super();
        this.#messageQueue = new processingQueue_js_1.ProcessingQueue(this.#processOutgoingMessage);
        this.#transport = bidiTransport;
        this.#transport.setOnMessage(this.#handleIncomingMessage);
        this.#commandProcessor = new CommandProcessor_js_1.CommandProcessor(cdpConnection, new EventManager_js_1.EventManager(this), selfTargetId, parser);
        this.#commandProcessor.on('response', (response) => {
            this.emitOutgoingMessage(response);
        });
    }
    static async createAndStart(bidiTransport, cdpConnection, selfTargetId, parser) {
        const server = new BidiServer(bidiTransport, cdpConnection, selfTargetId, parser);
        const cdpClient = cdpConnection.browserClient();
        // Needed to get events about new targets.
        await cdpClient.sendCommand('Target.setDiscoverTargets', { discover: true });
        // Needed to automatically attach to new targets.
        await cdpClient.sendCommand('Target.setAutoAttach', {
            autoAttach: true,
            waitForDebuggerOnStart: true,
            flatten: true,
        });
        await Promise.all(browsingContextStorage_js_1.BrowsingContextStorage.getTopLevelContexts().map((c) => c.awaitLoaded()));
        return server;
    }
    #processOutgoingMessage = async (messageEntry) => {
        const message = messageEntry.message;
        if (messageEntry.channel !== null) {
            message['channel'] = messageEntry.channel;
        }
        await this.#transport.sendMessage(message);
    };
    /**
     * Sends BiDi message.
     */
    emitOutgoingMessage(messageEntry) {
        this.#messageQueue.add(messageEntry);
    }
    close() {
        this.#transport.close();
    }
    #handleIncomingMessage = async (message) => {
        this.#commandProcessor.processCommand(message);
    };
}
exports.BidiServer = BidiServer;
//# sourceMappingURL=BidiServer.js.map

/***/ }),

/***/ 7002:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommandProcessor = void 0;
const browsingContextProcessor_js_1 = __webpack_require__(1538);
const protocol_js_1 = __webpack_require__(315);
const OutgoindBidiMessage_js_1 = __webpack_require__(9848);
const EventEmitter_js_1 = __webpack_require__(6111);
class BidiNoOpParser {
    parseGetRealmsParams(params) {
        return params;
    }
    parseCallFunctionParams(params) {
        return params;
    }
    parseEvaluateParams(params) {
        return params;
    }
    parseDisownParams(params) {
        return params;
    }
    parseSendCommandParams(params) {
        return params;
    }
    parseGetSessionParams(params) {
        return params;
    }
    parseNavigateParams(params) {
        return params;
    }
    parseGetTreeParams(params) {
        return params;
    }
    parseSubscribeParams(params) {
        return params;
    }
    parseCreateParams(params) {
        return params;
    }
    parseCloseParams(params) {
        return params;
    }
}
class CommandProcessor extends EventEmitter_js_1.EventEmitter {
    #contextProcessor;
    #eventManager;
    #parser;
    constructor(cdpConnection, eventManager, selfTargetId, parser = new BidiNoOpParser()) {
        super();
        this.#eventManager = eventManager;
        this.#contextProcessor = new browsingContextProcessor_js_1.BrowsingContextProcessor(cdpConnection, selfTargetId, eventManager);
        this.#parser = parser;
    }
    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    async #process_session_status() {
        return { result: { ready: false, message: 'already connected' } };
    }
    async #process_session_subscribe(params, channel) {
        await this.#eventManager.subscribe(params.events, params.contexts ?? [null], channel);
        return { result: {} };
    }
    async #process_session_unsubscribe(params, channel) {
        await this.#eventManager.unsubscribe(params.events, params.contexts ?? [null], channel);
        return { result: {} };
    }
    async #processCommand(commandData) {
        switch (commandData.method) {
            case 'session.status':
                return await this.#process_session_status();
            case 'session.subscribe':
                return await this.#process_session_subscribe(this.#parser.parseSubscribeParams(commandData.params), commandData.channel ?? null);
            case 'session.unsubscribe':
                return await this.#process_session_unsubscribe(this.#parser.parseSubscribeParams(commandData.params), commandData.channel ?? null);
            case 'browsingContext.create':
                return await this.#contextProcessor.process_browsingContext_create(this.#parser.parseCreateParams(commandData.params));
            case 'browsingContext.close':
                return await this.#contextProcessor.process_browsingContext_close(this.#parser.parseCloseParams(commandData.params));
            case 'browsingContext.getTree':
                return await this.#contextProcessor.process_browsingContext_getTree(this.#parser.parseGetTreeParams(commandData.params));
            case 'browsingContext.navigate':
                return await this.#contextProcessor.process_browsingContext_navigate(this.#parser.parseNavigateParams(commandData.params));
            case 'script.getRealms':
                return this.#contextProcessor.process_script_getRealms(this.#parser.parseGetRealmsParams(commandData.params));
            case 'script.callFunction':
                return await this.#contextProcessor.process_script_callFunction(this.#parser.parseCallFunctionParams(commandData.params));
            case 'script.evaluate':
                return await this.#contextProcessor.process_script_evaluate(this.#parser.parseEvaluateParams(commandData.params));
            case 'script.disown':
                return await this.#contextProcessor.process_script_disown(this.#parser.parseDisownParams(commandData.params));
            case 'cdp.sendCommand':
                return await this.#contextProcessor.process_cdp_sendCommand(this.#parser.parseSendCommandParams(commandData.params));
            case 'cdp.getSession':
                return await this.#contextProcessor.process_cdp_getSession(this.#parser.parseGetSessionParams(commandData.params));
            default:
                throw new protocol_js_1.Message.UnknownCommandException(`Unknown command '${commandData.method}'.`);
        }
    }
    processCommand = async (command) => {
        try {
            const result = await this.#processCommand(command);
            const response = {
                id: command.id,
                ...result,
            };
            this.emit('response', OutgoindBidiMessage_js_1.OutgoingBidiMessage.createResolved(response, command.channel ?? null));
        }
        catch (e) {
            if (e instanceof protocol_js_1.Message.ErrorResponseClass) {
                const errorResponse = e;
                this.emit('response', OutgoindBidiMessage_js_1.OutgoingBidiMessage.createResolved(errorResponse.toErrorResponse(command.id), command.channel ?? null));
            }
            else {
                const error = e;
                console.error(error);
                this.emit('response', OutgoindBidiMessage_js_1.OutgoingBidiMessage.createResolved(new protocol_js_1.Message.UnknownException(error.message).toErrorResponse(command.id), command.channel ?? null));
            }
        }
    };
}
exports.CommandProcessor = CommandProcessor;
//# sourceMappingURL=CommandProcessor.js.map

/***/ }),

/***/ 9848:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OutgoingBidiMessage = void 0;
class OutgoingBidiMessage {
    #message;
    #channel;
    constructor(message, channel) {
        this.#message = message;
        this.#channel = channel;
    }
    static async createFromPromise(messagePromise, channel) {
        const message = await messagePromise;
        return new OutgoingBidiMessage(message, channel);
    }
    static createResolved(message, channel) {
        return Promise.resolve(new OutgoingBidiMessage(message, channel));
    }
    get message() {
        return this.#message;
    }
    get channel() {
        return this.#channel;
    }
}
exports.OutgoingBidiMessage = OutgoingBidiMessage;
//# sourceMappingURL=OutgoindBidiMessage.js.map

/***/ }),

/***/ 1796:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var __webpack_unused_export__;

/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
__webpack_unused_export__ = ({ value: true });
exports.vp = exports.$z = void 0;
var BidiServer_js_1 = __webpack_require__(985);
Object.defineProperty(exports, "$z", ({ enumerable: true, get: function () { return BidiServer_js_1.BidiServer; } }));
var EventEmitter_js_1 = __webpack_require__(6111);
Object.defineProperty(exports, "vp", ({ enumerable: true, get: function () { return EventEmitter_js_1.EventEmitter; } }));
//# sourceMappingURL=bidiMapper.js.map

/***/ }),

/***/ 177:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BrowsingContextImpl = void 0;
const protocol_js_1 = __webpack_require__(315);
const deferred_js_1 = __webpack_require__(3343);
const logManager_js_1 = __webpack_require__(3805);
const realm_js_1 = __webpack_require__(3874);
const browsingContextStorage_js_1 = __webpack_require__(7652);
class BrowsingContextImpl {
    #targetDefers = {
        documentInitialized: new deferred_js_1.Deferred(),
        targetUnblocked: new deferred_js_1.Deferred(),
        Page: {
            navigatedWithinDocument: new deferred_js_1.Deferred(),
            lifecycleEvent: {
                DOMContentLoaded: new deferred_js_1.Deferred(),
                load: new deferred_js_1.Deferred(),
            },
        },
    };
    #contextId;
    #parentId;
    #cdpBrowserContextId;
    #eventManager;
    #children = new Map();
    #url = 'about:blank';
    #loaderId = null;
    #cdpSessionId;
    #cdpClient;
    #maybeDefaultRealm;
    get #defaultRealm() {
        if (this.#maybeDefaultRealm === undefined) {
            throw new Error(`No default realm for browsing context ${this.#contextId}`);
        }
        return this.#maybeDefaultRealm;
    }
    constructor(contextId, parentId, cdpClient, cdpSessionId, cdpBrowserContextId, eventManager) {
        this.#contextId = contextId;
        this.#parentId = parentId;
        this.#cdpClient = cdpClient;
        this.#cdpBrowserContextId = cdpBrowserContextId;
        this.#eventManager = eventManager;
        this.#cdpSessionId = cdpSessionId;
        this.#initListeners();
        browsingContextStorage_js_1.BrowsingContextStorage.addContext(this);
    }
    static async createFrameContext(contextId, parentId, cdpClient, cdpSessionId, eventManager) {
        const context = new BrowsingContextImpl(contextId, parentId, cdpClient, cdpSessionId, null, eventManager);
        context.#targetDefers.targetUnblocked.resolve();
        await eventManager.registerEvent({
            method: protocol_js_1.BrowsingContext.EventNames.ContextCreatedEvent,
            params: context.serializeToBidiValue(),
        }, context.contextId);
    }
    static async createTargetContext(contextId, parentId, cdpClient, cdpSessionId, cdpBrowserContextId, eventManager) {
        const context = new BrowsingContextImpl(contextId, parentId, cdpClient, cdpSessionId, cdpBrowserContextId, eventManager);
        // No need in waiting for target to be unblocked.
        // noinspection ES6MissingAwait
        context.#unblockAttachedTarget();
        await eventManager.registerEvent({
            method: protocol_js_1.BrowsingContext.EventNames.ContextCreatedEvent,
            params: context.serializeToBidiValue(),
        }, context.contextId);
    }
    get cdpBrowserContextId() {
        return this.#cdpBrowserContextId;
    }
    convertFrameToTargetContext(cdpClient, cdpSessionId) {
        this.#updateConnection(cdpClient, cdpSessionId);
        // No need in waiting for target to be unblocked.
        // noinspection JSIgnoredPromiseFromCall
        this.#unblockAttachedTarget();
    }
    async delete() {
        await this.#removeChildContexts();
        // Remove context from the parent.
        if (this.parentId !== null) {
            const parent = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(this.parentId);
            parent.#children.delete(this.contextId);
        }
        await this.#eventManager.registerEvent({
            method: protocol_js_1.BrowsingContext.EventNames.ContextDestroyedEvent,
            params: this.serializeToBidiValue(),
        }, this.contextId);
        browsingContextStorage_js_1.BrowsingContextStorage.removeContext(this.contextId);
    }
    async #removeChildContexts() {
        await Promise.all(this.children.map((child) => child.delete()));
    }
    #updateConnection(cdpClient, cdpSessionId) {
        if (!this.#targetDefers.targetUnblocked.isFinished) {
            this.#targetDefers.targetUnblocked.reject('OOPiF');
        }
        this.#targetDefers.targetUnblocked = new deferred_js_1.Deferred();
        this.#cdpClient = cdpClient;
        this.#cdpSessionId = cdpSessionId;
        this.#initListeners();
    }
    async #unblockAttachedTarget() {
        logManager_js_1.LogManager.create(this.#cdpClient, this.#cdpSessionId, this.#eventManager);
        await this.#cdpClient.sendCommand('Runtime.enable');
        await this.#cdpClient.sendCommand('Page.enable');
        await this.#cdpClient.sendCommand('Page.setLifecycleEventsEnabled', {
            enabled: true,
        });
        await this.#cdpClient.sendCommand('Target.setAutoAttach', {
            autoAttach: true,
            waitForDebuggerOnStart: true,
            flatten: true,
        });
        await this.#cdpClient.sendCommand('Runtime.runIfWaitingForDebugger');
        this.#targetDefers.targetUnblocked.resolve();
    }
    get contextId() {
        return this.#contextId;
    }
    get parentId() {
        return this.#parentId;
    }
    get cdpSessionId() {
        return this.#cdpSessionId;
    }
    get children() {
        return Array.from(this.#children.values());
    }
    get url() {
        return this.#url;
    }
    addChild(child) {
        this.#children.set(child.contextId, child);
    }
    async awaitLoaded() {
        await this.#targetDefers.Page.lifecycleEvent.load;
    }
    async awaitUnblocked() {
        await this.#targetDefers.targetUnblocked;
    }
    serializeToBidiValue(maxDepth = 0, addParentFiled = true) {
        return {
            context: this.#contextId,
            url: this.url,
            children: maxDepth > 0
                ? this.children.map((c) => c.serializeToBidiValue(maxDepth - 1, false))
                : null,
            ...(addParentFiled ? { parent: this.#parentId } : {}),
        };
    }
    #initListeners() {
        this.#cdpClient.on('Target.targetInfoChanged', (params) => {
            if (this.contextId !== params.targetInfo.targetId) {
                return;
            }
            this.#url = params.targetInfo.url;
        });
        this.#cdpClient.on('Page.frameNavigated', async (params) => {
            if (this.contextId !== params.frame.id) {
                return;
            }
            this.#url = params.frame.url + (params.frame.urlFragment ?? '');
            // At the point the page is initiated, all the nested iframes from the
            // previous page are detached and realms are destroyed.
            // Remove context's children.
            await this.#removeChildContexts();
            // Remove all the already created realms.
            realm_js_1.Realm.clearBrowsingContext(this.contextId);
        });
        this.#cdpClient.on('Page.navigatedWithinDocument', (params) => {
            if (this.contextId !== params.frameId) {
                return;
            }
            this.#url = params.url;
            this.#targetDefers.Page.navigatedWithinDocument.resolve(params);
        });
        this.#cdpClient.on('Page.lifecycleEvent', async (params) => {
            if (this.contextId !== params.frameId) {
                return;
            }
            if (params.name === 'init') {
                this.#documentChanged(params.loaderId);
                this.#targetDefers.documentInitialized.resolve();
            }
            if (params.name === 'commit') {
                this.#loaderId = params.loaderId;
                return;
            }
            if (params.loaderId !== this.#loaderId) {
                return;
            }
            switch (params.name) {
                case 'DOMContentLoaded':
                    this.#targetDefers.Page.lifecycleEvent.DOMContentLoaded.resolve(params);
                    await this.#eventManager.registerEvent({
                        method: protocol_js_1.BrowsingContext.EventNames.DomContentLoadedEvent,
                        params: {
                            context: this.contextId,
                            navigation: this.#loaderId,
                            url: this.#url,
                        },
                    }, this.contextId);
                    break;
                case 'load':
                    this.#targetDefers.Page.lifecycleEvent.load.resolve(params);
                    await this.#eventManager.registerEvent({
                        method: protocol_js_1.BrowsingContext.EventNames.LoadEvent,
                        params: {
                            context: this.contextId,
                            navigation: this.#loaderId,
                            url: this.#url,
                        },
                    }, this.contextId);
                    break;
            }
        });
        this.#cdpClient.on('Runtime.executionContextCreated', (params) => {
            if (params.context.auxData.frameId !== this.contextId) {
                return;
            }
            // Only this execution contexts are supported for now.
            if (!['default', 'isolated'].includes(params.context.auxData.type)) {
                return;
            }
            const realm = realm_js_1.Realm.create(params.context.uniqueId, this.contextId, params.context.id, this.#getOrigin(params), 
            // TODO: differentiate types.
            realm_js_1.RealmType.window, 
            // Sandbox name for isolated world.
            params.context.auxData.type === 'isolated'
                ? params.context.name
                : undefined, this.#cdpSessionId, this.#cdpClient);
            if (params.context.auxData.isDefault) {
                this.#maybeDefaultRealm = realm;
            }
        });
        this.#cdpClient.on('Runtime.executionContextDestroyed', (params) => {
            realm_js_1.Realm.findRealms({
                cdpSessionId: this.#cdpSessionId,
                executionContextId: params.executionContextId,
            }).map((realm) => realm.delete());
        });
    }
    #getOrigin(params) {
        if (params.context.auxData.type === 'isolated') {
            // Sandbox should have the same origin as the context itself, but in CDP
            // it has an empty one.
            return this.#defaultRealm.origin;
        }
        // https://html.spec.whatwg.org/multipage/origin.html#ascii-serialisation-of-an-origin
        return ['://', ''].includes(params.context.origin)
            ? 'null'
            : params.context.origin;
    }
    #documentChanged(loaderId) {
        if (this.#loaderId === loaderId) {
            return;
        }
        if (!this.#targetDefers.documentInitialized.isFinished) {
            this.#targetDefers.documentInitialized.reject('Document changed');
        }
        this.#targetDefers.documentInitialized = new deferred_js_1.Deferred();
        if (!this.#targetDefers.Page.navigatedWithinDocument.isFinished) {
            this.#targetDefers.Page.navigatedWithinDocument.reject('Document changed');
        }
        this.#targetDefers.Page.navigatedWithinDocument =
            new deferred_js_1.Deferred();
        if (!this.#targetDefers.Page.lifecycleEvent.DOMContentLoaded.isFinished) {
            this.#targetDefers.Page.lifecycleEvent.DOMContentLoaded.reject('Document changed');
        }
        this.#targetDefers.Page.lifecycleEvent.DOMContentLoaded =
            new deferred_js_1.Deferred();
        if (!this.#targetDefers.Page.lifecycleEvent.load.isFinished) {
            this.#targetDefers.Page.lifecycleEvent.load.reject('Document changed');
        }
        this.#targetDefers.Page.lifecycleEvent.load =
            new deferred_js_1.Deferred();
        this.#loaderId = loaderId;
    }
    async navigate(url, wait) {
        await this.#targetDefers.targetUnblocked;
        // TODO: handle loading errors.
        const cdpNavigateResult = await this.#cdpClient.sendCommand('Page.navigate', {
            url,
            frameId: this.contextId,
        });
        if (cdpNavigateResult.errorText) {
            throw new protocol_js_1.Message.UnknownException(cdpNavigateResult.errorText);
        }
        if (cdpNavigateResult.loaderId !== undefined &&
            cdpNavigateResult.loaderId !== this.#loaderId) {
            this.#documentChanged(cdpNavigateResult.loaderId);
        }
        // Wait for `wait` condition.
        switch (wait) {
            case 'none':
                break;
            case 'interactive':
                // No `loaderId` means same-document navigation.
                if (cdpNavigateResult.loaderId === undefined) {
                    await this.#targetDefers.Page.navigatedWithinDocument;
                }
                else {
                    await this.#targetDefers.Page.lifecycleEvent.DOMContentLoaded;
                }
                break;
            case 'complete':
                // No `loaderId` means same-document navigation.
                if (cdpNavigateResult.loaderId === undefined) {
                    await this.#targetDefers.Page.navigatedWithinDocument;
                }
                else {
                    await this.#targetDefers.Page.lifecycleEvent.load;
                }
                break;
            default:
                throw new Error(`Not implemented wait '${wait}'`);
        }
        return {
            result: {
                navigation: cdpNavigateResult.loaderId || null,
                url: url,
            },
        };
    }
    async getOrCreateSandbox(sandbox) {
        if (sandbox === undefined || sandbox === '') {
            return this.#defaultRealm;
        }
        let maybeSandboxes = realm_js_1.Realm.findRealms({
            browsingContextId: this.contextId,
            sandbox,
        });
        if (maybeSandboxes.length == 0) {
            await this.#cdpClient.sendCommand('Page.createIsolatedWorld', {
                frameId: this.contextId,
                worldName: sandbox,
            });
            // `Runtime.executionContextCreated` should be emitted by the time the
            // previous command is done.
            maybeSandboxes = realm_js_1.Realm.findRealms({
                browsingContextId: this.contextId,
                sandbox,
            });
        }
        if (maybeSandboxes.length !== 1) {
            throw Error(`Sandbox ${sandbox} wasn't created.`);
        }
        return maybeSandboxes[0];
    }
}
exports.BrowsingContextImpl = BrowsingContextImpl;
//# sourceMappingURL=browsingContextImpl.js.map

/***/ }),

/***/ 1538:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BrowsingContextProcessor = void 0;
const log_js_1 = __webpack_require__(5598);
const protocol_js_1 = __webpack_require__(315);
const browsingContextImpl_js_1 = __webpack_require__(177);
const realm_js_1 = __webpack_require__(3874);
const browsingContextStorage_js_1 = __webpack_require__(7652);
const logContext = (0, log_js_1.log)(log_js_1.LogType.browsingContexts);
class BrowsingContextProcessor {
    sessions = new Set();
    #cdpConnection;
    #selfTargetId;
    #eventManager;
    constructor(cdpConnection, selfTargetId, eventManager) {
        this.#cdpConnection = cdpConnection;
        this.#selfTargetId = selfTargetId;
        this.#eventManager = eventManager;
        this.#setBrowserClientEventListeners(this.#cdpConnection.browserClient());
    }
    #setBrowserClientEventListeners(browserClient) {
        this.#setTargetEventListeners(browserClient);
    }
    #setTargetEventListeners(cdpClient) {
        cdpClient.on('Target.attachedToTarget', async (params) => {
            await this.#handleAttachedToTargetEvent(params, cdpClient);
        });
        cdpClient.on('Target.detachedFromTarget', async (params) => {
            await BrowsingContextProcessor.#handleDetachedFromTargetEvent(params);
        });
    }
    #setSessionEventListeners(sessionId) {
        if (this.sessions.has(sessionId)) {
            return;
        }
        this.sessions.add(sessionId);
        const sessionCdpClient = this.#cdpConnection.getCdpClient(sessionId);
        this.#setTargetEventListeners(sessionCdpClient);
        sessionCdpClient.on('*', async (method, params) => {
            await this.#eventManager.registerEvent({
                method: protocol_js_1.CDP.EventNames.EventReceivedEvent,
                params: {
                    cdpMethod: method,
                    cdpParams: params || {},
                    cdpSession: sessionId,
                },
            }, null);
        });
        sessionCdpClient.on('Page.frameAttached', async (params) => {
            await browsingContextImpl_js_1.BrowsingContextImpl.createFrameContext(params.frameId, params.parentFrameId, sessionCdpClient, sessionId, this.#eventManager);
        });
    }
    async #handleAttachedToTargetEvent(params, parentSessionCdpClient) {
        const { sessionId, targetInfo } = params;
        let targetSessionCdpClient = this.#cdpConnection.getCdpClient(sessionId);
        if (!this.#isValidTarget(targetInfo)) {
            // DevTools or some other not supported by BiDi target.
            await targetSessionCdpClient.sendCommand('Runtime.runIfWaitingForDebugger');
            await parentSessionCdpClient.sendCommand('Target.detachFromTarget', params);
            return;
        }
        logContext('AttachedToTarget event received: ' + JSON.stringify(params));
        this.#setSessionEventListeners(sessionId);
        if (browsingContextStorage_js_1.BrowsingContextStorage.hasKnownContext(targetInfo.targetId)) {
            // OOPiF.
            browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(targetInfo.targetId).convertFrameToTargetContext(targetSessionCdpClient, sessionId);
        }
        else {
            await browsingContextImpl_js_1.BrowsingContextImpl.createTargetContext(targetInfo.targetId, null, targetSessionCdpClient, sessionId, params.targetInfo.browserContextId ?? null, this.#eventManager);
        }
    }
    // { "method": "Target.detachedFromTarget",
    //   "params": {
    //     "sessionId": "7EFBFB2A4942A8989B3EADC561BC46E9",
    //     "targetId": "19416886405CBA4E03DBB59FA67FF4E8" } }
    static async #handleDetachedFromTargetEvent(params) {
        // TODO: params.targetId is deprecated. Update this class to track using
        // params.sessionId instead.
        // https://github.com/GoogleChromeLabs/chromium-bidi/issues/60
        const contextId = params.targetId;
        await browsingContextStorage_js_1.BrowsingContextStorage.findContext(contextId)?.delete();
    }
    async process_browsingContext_getTree(params) {
        const resultContexts = params.root === undefined
            ? browsingContextStorage_js_1.BrowsingContextStorage.getTopLevelContexts()
            : [browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(params.root)];
        return {
            result: {
                contexts: resultContexts.map((c) => c.serializeToBidiValue(params.maxDepth ?? Number.MAX_VALUE)),
            },
        };
    }
    async process_browsingContext_create(params) {
        const browserCdpClient = this.#cdpConnection.browserClient();
        let referenceContext = undefined;
        if (params.referenceContext !== undefined) {
            referenceContext = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(params.referenceContext);
            if (referenceContext.parentId !== null) {
                throw new protocol_js_1.Message.InvalidArgumentException(`referenceContext should be a top-level context`);
            }
        }
        const result = await browserCdpClient.sendCommand('Target.createTarget', {
            url: 'about:blank',
            newWindow: params.type === 'window',
            ...(referenceContext?.cdpBrowserContextId
                ? { browserContextId: referenceContext.cdpBrowserContextId }
                : {}),
        });
        // Wait for the new tab to be loaded to avoid race conditions in the
        // `browsingContext` events, when the `browsingContext.domContentLoaded` and
        // `browsingContext.load` events from the initial `about:blank` navigation
        // are emitted after the next navigation is started.
        // Details: https://github.com/web-platform-tests/wpt/issues/35846
        const contextId = result.targetId;
        const context = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(contextId);
        await context.awaitLoaded();
        return {
            result: context.serializeToBidiValue(1),
        };
    }
    async process_browsingContext_navigate(params) {
        const context = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(params.context);
        return await context.navigate(params.url, params.wait !== undefined ? params.wait : 'none');
    }
    static async #getRealm(target) {
        if ('realm' in target) {
            return realm_js_1.Realm.getRealm({ realmId: target.realm });
        }
        const context = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(target.context);
        return await context.getOrCreateSandbox(target.sandbox);
    }
    async process_script_evaluate(params) {
        const realm = await BrowsingContextProcessor.#getRealm(params.target);
        return await realm.scriptEvaluate(params.expression, params.awaitPromise, params.resultOwnership ?? 'none');
    }
    process_script_getRealms(params) {
        if (params.context !== undefined) {
            // Make sure the context is known.
            browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(params.context);
        }
        const realms = realm_js_1.Realm.findRealms({
            browsingContextId: params.context,
            type: params.type,
        }).map((realm) => realm.toBiDi());
        return { result: { realms } };
    }
    async process_script_callFunction(params) {
        const realm = await BrowsingContextProcessor.#getRealm(params.target);
        return await realm.callFunction(params.functionDeclaration, params.this || {
            type: 'undefined',
        }, // `this` is `undefined` by default.
        params.arguments || [], // `arguments` is `[]` by default.
        params.awaitPromise, params.resultOwnership ?? 'none');
    }
    async process_script_disown(params) {
        const realm = await BrowsingContextProcessor.#getRealm(params.target);
        await Promise.all(params.handles.map(async (h) => await realm.disown(h)));
        return { result: {} };
    }
    async process_browsingContext_close(commandParams) {
        const browserCdpClient = this.#cdpConnection.browserClient();
        const context = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(commandParams.context);
        if (context.parentId !== null) {
            throw new protocol_js_1.Message.InvalidArgumentException('Not a top-level browsing context cannot be closed.');
        }
        const detachedFromTargetPromise = new Promise(async (resolve) => {
            const onContextDestroyed = (eventParams) => {
                if (eventParams.targetId === commandParams.context) {
                    browserCdpClient.off('Target.detachedFromTarget', onContextDestroyed);
                    resolve();
                }
            };
            browserCdpClient.on('Target.detachedFromTarget', onContextDestroyed);
        });
        await this.#cdpConnection
            .browserClient()
            .sendCommand('Target.closeTarget', {
            targetId: commandParams.context,
        });
        // Sometimes CDP command finishes before `detachedFromTarget` event,
        // sometimes after. Wait for the CDP command to be finished, and then wait
        // for `detachedFromTarget` if it hasn't emitted.
        await detachedFromTargetPromise;
        return { result: {} };
    }
    #isValidTarget(target) {
        if (target.targetId === this.#selfTargetId) {
            return false;
        }
        return ['page', 'iframe'].includes(target.type);
    }
    async process_cdp_sendCommand(params) {
        const client = params.cdpSession
            ? this.#cdpConnection.getCdpClient(params.cdpSession)
            : this.#cdpConnection.browserClient();
        const sendCdpCommandResult = await client.sendCommand(params.cdpMethod, params.cdpParams);
        return {
            result: sendCdpCommandResult,
            cdpSession: params.cdpSession,
        };
    }
    async process_cdp_getSession(params) {
        const context = params.context;
        const sessionId = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(context).cdpSessionId;
        if (sessionId === undefined) {
            return { result: { cdpSession: null } };
        }
        return { result: { cdpSession: sessionId } };
    }
}
exports.BrowsingContextProcessor = BrowsingContextProcessor;
//# sourceMappingURL=browsingContextProcessor.js.map

/***/ }),

/***/ 7652:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BrowsingContextStorage = void 0;
const protocol_js_1 = __webpack_require__(315);
class BrowsingContextStorage {
    static #contexts = new Map();
    static getTopLevelContexts() {
        return Array.from(BrowsingContextStorage.#contexts.values()).filter((c) => c.parentId === null);
    }
    static removeContext(contextId) {
        BrowsingContextStorage.#contexts.delete(contextId);
    }
    static addContext(context) {
        BrowsingContextStorage.#contexts.set(context.contextId, context);
        if (context.parentId !== null) {
            BrowsingContextStorage.getKnownContext(context.parentId).addChild(context);
        }
    }
    static hasKnownContext(contextId) {
        return BrowsingContextStorage.#contexts.has(contextId);
    }
    static findContext(contextId) {
        return BrowsingContextStorage.#contexts.get(contextId);
    }
    static getKnownContext(contextId) {
        const result = BrowsingContextStorage.findContext(contextId);
        if (result === undefined) {
            throw new protocol_js_1.Message.NoSuchFrameException(`Context ${contextId} not found`);
        }
        return result;
    }
}
exports.BrowsingContextStorage = BrowsingContextStorage;
//# sourceMappingURL=browsingContextStorage.js.map

/***/ }),

/***/ 8701:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventManager = void 0;
const OutgoindBidiMessage_js_1 = __webpack_require__(9848);
const SubscriptionManager_js_1 = __webpack_require__(9793);
const idWrapper_js_1 = __webpack_require__(3018);
const buffer_js_1 = __webpack_require__(5860);
const browsingContextStorage_js_1 = __webpack_require__(7652);
class EventWrapper extends idWrapper_js_1.IdWrapper {
    #contextId;
    #event;
    constructor(event, contextId) {
        super();
        this.#contextId = contextId;
        this.#event = event;
    }
    get contextId() {
        return this.#contextId;
    }
    get event() {
        return this.#event;
    }
}
class EventManager {
    /**
     * Maps event name to a desired buffer length.
     */
    static #eventBufferLength = new Map([
        ['log.entryAdded', 100],
    ]);
    /**
     * Maps event name to a set of contexts where this event already happened.
     * Needed for getting buffered events from all the contexts in case of
     * subscripting to all contexts.
     */
    #eventToContextsMap = new Map();
    /**
     * Maps `eventName` + `browsingContext` to buffer. Used to get buffered events
     * during subscription. Channel-agnostic.
     */
    #eventBuffers = new Map();
    /**
     * Maps `eventName` + `browsingContext` + `channel` to last sent event id.
     * Used to avoid sending duplicated events when user
     * subscribes -> unsubscribes -> subscribes.
     */
    #lastMessageSent = new Map();
    #subscriptionManager;
    #bidiServer;
    constructor(bidiServer) {
        this.#bidiServer = bidiServer;
        this.#subscriptionManager = new SubscriptionManager_js_1.SubscriptionManager();
    }
    /**
     * Returns consistent key to be used to access value maps.
     */
    static #getMapKey(eventName, browsingContext, channel = undefined) {
        return JSON.stringify({ eventName, browsingContext, channel });
    }
    async registerEvent(event, contextId) {
        await this.registerPromiseEvent(Promise.resolve(event), contextId, event.method);
    }
    async registerPromiseEvent(event, contextId, eventName) {
        const eventWrapper = new EventWrapper(event, contextId);
        const sortedChannels = this.#subscriptionManager.getChannelsSubscribedToEvent(eventName, contextId);
        this.#bufferEvent(eventWrapper, eventName);
        // Send events to channels in the subscription priority.
        for (const channel of sortedChannels) {
            this.#bidiServer.emitOutgoingMessage(OutgoindBidiMessage_js_1.OutgoingBidiMessage.createFromPromise(event, channel));
            this.#markEventSent(eventWrapper, channel, eventName);
        }
    }
    async subscribe(eventNames, contextIds, channel) {
        for (let eventName of eventNames) {
            for (let contextId of contextIds) {
                if (contextId !== null &&
                    !browsingContextStorage_js_1.BrowsingContextStorage.hasKnownContext(contextId)) {
                    // Unknown context. Do nothing.
                    continue;
                }
                this.#subscriptionManager.subscribe(eventName, contextId, channel);
                for (let eventWrapper of this.#getBufferedEvents(eventName, contextId, channel)) {
                    // The order of the events is important.
                    this.#bidiServer.emitOutgoingMessage(OutgoindBidiMessage_js_1.OutgoingBidiMessage.createFromPromise(eventWrapper.event, channel));
                    this.#markEventSent(eventWrapper, channel, eventName);
                }
            }
        }
    }
    async unsubscribe(events, contextIds, channel) {
        for (let event of events) {
            for (let contextId of contextIds) {
                this.#subscriptionManager.unsubscribe(event, contextId, channel);
            }
        }
    }
    /**
     * If the event is buffer-able, put it in the buffer.
     */
    #bufferEvent(eventWrapper, eventName) {
        if (!EventManager.#eventBufferLength.has(eventName)) {
            // Do nothing if the event is no buffer-able.
            return;
        }
        const bufferMapKey = EventManager.#getMapKey(eventName, eventWrapper.contextId);
        if (!this.#eventBuffers.has(bufferMapKey)) {
            this.#eventBuffers.set(bufferMapKey, new buffer_js_1.Buffer(EventManager.#eventBufferLength.get(eventName)));
        }
        this.#eventBuffers.get(bufferMapKey).add(eventWrapper);
        // Add the context to the list of contexts having `eventName` events.
        if (!this.#eventToContextsMap.has(eventName)) {
            this.#eventToContextsMap.set(eventName, new Set());
        }
        this.#eventToContextsMap.get(eventName).add(eventWrapper.contextId);
    }
    /**
     * If the event is buffer-able, mark it as sent to the given contextId and channel.
     */
    #markEventSent(eventWrapper, channel, eventName) {
        if (!EventManager.#eventBufferLength.has(eventName)) {
            // Do nothing if the event is no buffer-able.
            return;
        }
        const lastSentMapKey = EventManager.#getMapKey(eventName, eventWrapper.contextId, channel);
        this.#lastMessageSent.set(lastSentMapKey, Math.max(this.#lastMessageSent.get(lastSentMapKey) ?? 0, eventWrapper.id));
    }
    /**
     * Returns events which are buffered and not yet sent to the given channel events.
     */
    #getBufferedEvents(eventName, contextId, channel) {
        const bufferMapKey = EventManager.#getMapKey(eventName, contextId);
        const lastSentMapKey = EventManager.#getMapKey(eventName, contextId, channel);
        const lastSentMessageId = this.#lastMessageSent.get(lastSentMapKey) ?? -Infinity;
        const result = this.#eventBuffers
            .get(bufferMapKey)
            ?.get()
            .filter((wrapper) => wrapper.id > lastSentMessageId) ?? [];
        if (contextId === null) {
            // For global subscriptions, events buffered in each context should be sent back.
            Array.from(this.#eventToContextsMap.get(eventName)?.keys() ?? [])
                // Events without context are already in the result.
                .filter((_contextId) => _contextId !== null)
                .map((_contextId) => this.#getBufferedEvents(eventName, _contextId, channel))
                .forEach((events) => result.push(...events));
        }
        return result.sort((e1, e2) => e1.id - e2.id);
    }
}
exports.EventManager = EventManager;
//# sourceMappingURL=EventManager.js.map

/***/ }),

/***/ 9793:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SubscriptionManager = void 0;
class SubscriptionManager {
    #subscriptionPriority = 0;
    // BrowsingContext `null` means the event has subscription across all the
    // browsing contexts.
    // Channel `null` means no `channel` should be added.
    #channelToContextToEventMap = new Map();
    getChannelsSubscribedToEvent(eventMethod, contextId) {
        const prioritiesAndChannels = Array.from(this.#channelToContextToEventMap.keys())
            .map((channel) => ({
            priority: this.#getEventSubscriptionPriorityForChannel(eventMethod, contextId, channel),
            channel,
        }))
            .filter(({ priority }) => priority !== null);
        // Sort channels by priority.
        return prioritiesAndChannels
            .sort((a, b) => a.priority - b.priority)
            .map(({ channel }) => channel);
    }
    #getEventSubscriptionPriorityForChannel(eventMethod, contextId, channel) {
        const contextToEventMap = this.#channelToContextToEventMap.get(channel);
        if (contextToEventMap === undefined) {
            return null;
        }
        // Get all the subscription priorities.
        let priorities = [
            contextToEventMap.get(null)?.get(eventMethod),
            contextToEventMap.get(contextId)?.get(eventMethod),
        ].filter((p) => p !== undefined);
        if (priorities.length === 0) {
            // Not subscribed, return null.
            return null;
        }
        // Return minimal priority.
        return Math.min(...priorities);
    }
    subscribe(event, contextId, channel) {
        if (!this.#channelToContextToEventMap.has(channel)) {
            this.#channelToContextToEventMap.set(channel, new Map());
        }
        const contextToEventMap = this.#channelToContextToEventMap.get(channel);
        if (!contextToEventMap.has(contextId)) {
            contextToEventMap.set(contextId, new Map());
        }
        const eventMap = contextToEventMap.get(contextId);
        // Do not re-subscribe to events to keep the priority.
        if (eventMap.has(event)) {
            return;
        }
        eventMap.set(event, this.#subscriptionPriority++);
    }
    unsubscribe(event, contextId, channel) {
        if (!this.#channelToContextToEventMap.has(channel)) {
            return;
        }
        const contextToEventMap = this.#channelToContextToEventMap.get(channel);
        if (!contextToEventMap.has(contextId)) {
            return;
        }
        const eventMap = contextToEventMap.get(contextId);
        eventMap.delete(event);
        // Clean up maps if empty.
        if (eventMap.size === 0) {
            contextToEventMap.delete(event);
        }
        if (contextToEventMap.size === 0) {
            this.#channelToContextToEventMap.delete(channel);
        }
    }
}
exports.SubscriptionManager = SubscriptionManager;
//# sourceMappingURL=SubscriptionManager.js.map

/***/ }),

/***/ 9283:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getRemoteValuesText = exports.logMessageFormatter = void 0;
const specifiers = ['%s', '%d', '%i', '%f', '%o', '%O', '%c'];
function isFormmatSpecifier(str) {
    return specifiers.some((spec) => str.includes(spec));
}
/**
 * @param args input remote values to be format printed
 * @returns parsed text of the remote values in specific format
 */
function logMessageFormatter(args) {
    let output = '';
    const argFormat = args[0].value.toString();
    const argValues = args.slice(1, undefined);
    const tokens = argFormat.split(new RegExp(specifiers.map((spec) => '(' + spec + ')').join('|'), 'g'));
    for (const token of tokens) {
        if (token === undefined || token == '') {
            continue;
        }
        if (isFormmatSpecifier(token)) {
            const arg = argValues.shift();
            // raise an exception when less value is provided
            if (arg === undefined) {
                throw new Error('Less value is provided: "' + getRemoteValuesText(args, false) + '"');
            }
            if (token === '%s') {
                output += stringFromArg(arg);
            }
            else if (token === '%d' || token === '%i') {
                if (arg.type === 'bigint' ||
                    arg.type === 'number' ||
                    arg.type === 'string') {
                    output += parseInt(arg.value.toString(), 10);
                }
                else {
                    output += 'NaN';
                }
            }
            else if (token === '%f') {
                if (arg.type === 'bigint' ||
                    arg.type === 'number' ||
                    arg.type === 'string') {
                    output += parseFloat(arg.value.toString());
                }
                else {
                    output += 'NaN';
                }
            }
            else {
                // %o, %O, %c
                output += toJson(arg);
            }
        }
        else {
            output += token;
        }
    }
    // raise an exception when more value is provided
    if (argValues.length > 0) {
        throw new Error('More value is provided: "' + getRemoteValuesText(args, false) + '"');
    }
    return output;
}
exports.logMessageFormatter = logMessageFormatter;
/**
 * @param arg input remote value to be parsed
 * @returns parsed text of the remote value
 *
 * input: {"type": "number", "value": 1}
 * output: 1
 *
 * input: {"type": "string", "value": "abc"}
 * output: "abc"
 *
 * input: {"type": "object",  "value": [["id", {"type": "number", "value": 1}]]}
 * output: '{"id": 1}'
 *
 * input: {"type": "object", "value": [["font-size", {"type": "string", "value": "20px"}]]}
 * output: '{"font-size": "20px"}'
 */
function toJson(arg) {
    // arg type validation
    if (arg.type !== 'array' &&
        arg.type !== 'bigint' &&
        arg.type !== 'date' &&
        arg.type !== 'number' &&
        arg.type !== 'object' &&
        arg.type !== 'string') {
        return stringFromArg(arg);
    }
    if (arg.type === 'bigint') {
        return arg.value.toString() + 'n';
    }
    if (arg.type === 'number') {
        return arg.value.toString();
    }
    if (['date', 'string'].includes(arg.type)) {
        return JSON.stringify(arg.value);
    }
    if (arg.type === 'object') {
        return ('{' +
            arg.value
                .map((pair) => {
                return `${JSON.stringify(pair[0])}:${toJson(pair[1])}`;
            })
                .join(',') +
            '}');
    }
    if (arg.type === 'array') {
        return '[' + arg.value.map((val) => toJson(val)).join(',') + ']';
    }
    throw Error('Invalid value type: ' + arg.toString());
}
function stringFromArg(arg) {
    if (!arg.hasOwnProperty('value')) {
        return arg.type;
    }
    switch (arg.type) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'bigint':
            return String(arg.value);
        case 'regexp':
            return `/${arg.value.pattern}/${arg.value.flags}`;
        case 'date':
            return new Date(arg.value).toString();
        case 'object':
            return `Object(${arg.value?.length})`;
        case 'array':
            return `Array(${arg.value?.length})`;
        case 'map':
            return `Map(${arg.value.length})`;
        case 'set':
            return `Set(${arg.value.length})`;
        case 'node':
            return 'node';
        default:
            return arg.type;
    }
}
function getRemoteValuesText(args, formatText) {
    const arg = args[0];
    if (!arg) {
        return '';
    }
    // if args[0] is a format specifier, format the args as output
    if (arg.type === 'string' &&
        isFormmatSpecifier(arg.value.toString()) &&
        formatText) {
        return logMessageFormatter(args);
    }
    // if args[0] is not a format specifier, just join the args with \u0020
    return args
        .map((arg) => {
        return stringFromArg(arg);
    })
        .join('\u0020');
}
exports.getRemoteValuesText = getRemoteValuesText;
//# sourceMappingURL=logHelper.js.map

/***/ }),

/***/ 3805:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogManager = void 0;
const protocol_js_1 = __webpack_require__(315);
const logHelper_js_1 = __webpack_require__(9283);
const realm_js_1 = __webpack_require__(3874);
class LogManager {
    #cdpClient;
    #cdpSessionId;
    #eventManager;
    constructor(cdpClient, cdpSessionId, eventManager) {
        this.#cdpSessionId = cdpSessionId;
        this.#cdpClient = cdpClient;
        this.#eventManager = eventManager;
    }
    static create(cdpClient, cdpSessionId, eventManager) {
        const logManager = new LogManager(cdpClient, cdpSessionId, eventManager);
        logManager.#initialize();
        return logManager;
    }
    #initialize() {
        this.#initializeEventListeners();
    }
    #initializeEventListeners() {
        this.#initializeLogEntryAddedEventListener();
    }
    #initializeLogEntryAddedEventListener() {
        this.#cdpClient.on('Runtime.consoleAPICalled', (params) => {
            // Try to find realm by `cdpSessionId` and `executionContextId`,
            // if provided.
            const realm = realm_js_1.Realm.findRealm({
                cdpSessionId: this.#cdpSessionId,
                executionContextId: params.executionContextId,
            });
            const argsPromise = realm === undefined
                ? Promise.resolve(params.args)
                : // Properly serialize arguments if possible.
                    Promise.all(params.args.map(async (arg) => {
                        return realm.serializeCdpObject(arg, 'none');
                    }));
            // No need in waiting for the result, just register the event promise.
            // noinspection JSIgnoredPromiseFromCall
            this.#eventManager.registerPromiseEvent(argsPromise.then((args) => ({
                method: protocol_js_1.Log.EventNames.LogEntryAddedEvent,
                params: {
                    level: LogManager.#getLogLevel(params.type),
                    source: {
                        realm: realm?.realmId ?? 'UNKNOWN',
                        context: realm?.browsingContextId ?? 'UNKNOWN',
                    },
                    text: (0, logHelper_js_1.getRemoteValuesText)(args, true),
                    timestamp: Math.round(params.timestamp),
                    stackTrace: LogManager.#getBidiStackTrace(params.stackTrace),
                    type: 'console',
                    // Console method is `warn`, not `warning`.
                    method: params.type === 'warning' ? 'warn' : params.type,
                    args,
                },
            })), realm?.browsingContextId ?? 'UNKNOWN', protocol_js_1.Log.EventNames.LogEntryAddedEvent);
        });
        this.#cdpClient.on('Runtime.exceptionThrown', (params) => {
            // Try to find realm by `cdpSessionId` and `executionContextId`,
            // if provided.
            const realm = realm_js_1.Realm.findRealm({
                cdpSessionId: this.#cdpSessionId,
                executionContextId: params.exceptionDetails.executionContextId,
            });
            // Try all the best to get the exception text.
            const textPromise = (async () => {
                if (!params.exceptionDetails.exception) {
                    return params.exceptionDetails.text;
                }
                if (realm === undefined) {
                    return JSON.stringify(params.exceptionDetails.exception);
                }
                return await realm.stringifyObject(params.exceptionDetails.exception);
            })();
            // No need in waiting for the result, just register the event promise.
            // noinspection JSIgnoredPromiseFromCall
            this.#eventManager.registerPromiseEvent(textPromise.then((text) => ({
                method: protocol_js_1.Log.EventNames.LogEntryAddedEvent,
                params: {
                    level: 'error',
                    source: {
                        realm: realm?.realmId ?? 'UNKNOWN',
                        context: realm?.browsingContextId ?? 'UNKNOWN',
                    },
                    text,
                    timestamp: Math.round(params.timestamp),
                    stackTrace: LogManager.#getBidiStackTrace(params.exceptionDetails.stackTrace),
                    type: 'javascript',
                },
            })), realm?.browsingContextId ?? 'UNKNOWN', protocol_js_1.Log.EventNames.LogEntryAddedEvent);
        });
    }
    static #getLogLevel(consoleApiType) {
        if (['assert', 'error'].includes(consoleApiType)) {
            return 'error';
        }
        if (['debug', 'trace'].includes(consoleApiType)) {
            return 'debug';
        }
        if (['warn', 'warning'].includes(consoleApiType)) {
            return 'warn';
        }
        return 'info';
    }
    // convert CDP StackTrace object to Bidi StackTrace object
    static #getBidiStackTrace(cdpStackTrace) {
        const stackFrames = cdpStackTrace?.callFrames.map((callFrame) => {
            return {
                columnNumber: callFrame.columnNumber,
                functionName: callFrame.functionName,
                lineNumber: callFrame.lineNumber,
                url: callFrame.url,
            };
        });
        return stackFrames ? { callFrames: stackFrames } : undefined;
    }
}
exports.LogManager = LogManager;
//# sourceMappingURL=logManager.js.map

/***/ }),

/***/ 3874:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Realm = exports.RealmType = void 0;
const protocol_js_1 = __webpack_require__(315);
const scriptEvaluator_js_1 = __webpack_require__(1376);
const browsingContextStorage_js_1 = __webpack_require__(7652);
var RealmType;
(function (RealmType) {
    RealmType["window"] = "window";
})(RealmType = exports.RealmType || (exports.RealmType = {}));
class Realm {
    static #realmMap = new Map();
    static create(realmId, browsingContextId, executionContextId, origin, type, sandbox, cdpSessionId, cdpClient) {
        const realm = new Realm(realmId, browsingContextId, executionContextId, origin, type, sandbox, cdpSessionId, cdpClient);
        Realm.#realmMap.set(realm.realmId, realm);
        return realm;
    }
    static findRealms(filter = {}) {
        return Array.from(Realm.#realmMap.values()).filter((realm) => {
            if (filter.realmId !== undefined && filter.realmId !== realm.realmId) {
                return false;
            }
            if (filter.browsingContextId !== undefined &&
                filter.browsingContextId !== realm.browsingContextId) {
                return false;
            }
            if (filter.executionContextId !== undefined &&
                filter.executionContextId !== realm.executionContextId) {
                return false;
            }
            if (filter.type !== undefined && filter.type !== realm.type) {
                return false;
            }
            if (filter.sandbox !== undefined && filter.sandbox !== realm.#sandbox) {
                return false;
            }
            if (filter.cdpSessionId !== undefined &&
                filter.cdpSessionId !== realm.#cdpSessionId) {
                return false;
            }
            return true;
        });
    }
    static findRealm(filter) {
        const maybeRealms = Realm.findRealms(filter);
        if (maybeRealms.length !== 1) {
            return undefined;
        }
        return maybeRealms[0];
    }
    static getRealm(filter) {
        const maybeRealm = Realm.findRealm(filter);
        if (maybeRealm === undefined) {
            throw new protocol_js_1.Message.NoSuchFrameException(`Realm ${JSON.stringify(filter)} not found`);
        }
        return maybeRealm;
    }
    static clearBrowsingContext(browsingContextId) {
        Realm.findRealms({ browsingContextId }).map((realm) => realm.delete());
    }
    delete() {
        Realm.#realmMap.delete(this.realmId);
        scriptEvaluator_js_1.ScriptEvaluator.realmDestroyed(this);
    }
    #realmId;
    #browsingContextId;
    #executionContextId;
    #origin;
    #type;
    #sandbox;
    #cdpSessionId;
    #cdpClient;
    constructor(realmId, browsingContextId, executionContextId, origin, type, sandbox, cdpSessionId, cdpClient) {
        this.#realmId = realmId;
        this.#browsingContextId = browsingContextId;
        this.#executionContextId = executionContextId;
        this.#sandbox = sandbox;
        this.#origin = origin;
        this.#type = type;
        this.#cdpSessionId = cdpSessionId;
        this.#cdpClient = cdpClient;
    }
    toBiDi() {
        return {
            realm: this.realmId,
            origin: this.origin,
            type: this.type,
            context: this.browsingContextId,
            ...(this.#sandbox !== undefined ? { sandbox: this.#sandbox } : {}),
        };
    }
    get realmId() {
        return this.#realmId;
    }
    get browsingContextId() {
        return this.#browsingContextId;
    }
    get executionContextId() {
        return this.#executionContextId;
    }
    get origin() {
        return this.#origin;
    }
    get type() {
        return this.#type;
    }
    get cdpClient() {
        return this.#cdpClient;
    }
    async callFunction(functionDeclaration, _this, _arguments, awaitPromise, resultOwnership) {
        const context = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(this.browsingContextId);
        await context.awaitUnblocked();
        return {
            result: await scriptEvaluator_js_1.ScriptEvaluator.callFunction(this, functionDeclaration, _this, _arguments, awaitPromise, resultOwnership),
        };
    }
    async scriptEvaluate(expression, awaitPromise, resultOwnership) {
        const context = browsingContextStorage_js_1.BrowsingContextStorage.getKnownContext(this.browsingContextId);
        await context.awaitUnblocked();
        return {
            result: await scriptEvaluator_js_1.ScriptEvaluator.scriptEvaluate(this, expression, awaitPromise, resultOwnership),
        };
    }
    async disown(handle) {
        await scriptEvaluator_js_1.ScriptEvaluator.disown(this, handle);
    }
    /**
     * Serializes a given CDP object into BiDi, keeping references in the
     * target's `globalThis`.
     * @param cdpObject CDP remote object to be serialized.
     * @param resultOwnership indicates desired OwnershipModel.
     */
    async serializeCdpObject(cdpObject, resultOwnership) {
        return await scriptEvaluator_js_1.ScriptEvaluator.serializeCdpObject(cdpObject, resultOwnership, this);
    }
    /**
     * Gets the string representation of an object. This is equivalent to
     * calling toString() on the object value.
     * @param cdpObject CDP remote object representing an object.
     * @param realm
     * @returns string The stringified object.
     */
    async stringifyObject(cdpObject) {
        return scriptEvaluator_js_1.ScriptEvaluator.stringifyObject(cdpObject, this);
    }
}
exports.Realm = Realm;
//# sourceMappingURL=realm.js.map

/***/ }),

/***/ 1376:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScriptEvaluator = void 0;
const protocol_js_1 = __webpack_require__(315);
class ScriptEvaluator {
    // As `script.evaluate` wraps call into serialization script, `lineNumber`
    // should be adjusted.
    static #evaluateStacktraceLineOffset = 0;
    static #callFunctionStacktraceLineOffset = 1;
    // Keeps track of `handle`s and their realms sent to client.
    static #knownHandlesToRealm = new Map();
    /**
     * Serializes a given CDP object into BiDi, keeping references in the
     * target's `globalThis`.
     * @param cdpRemoteObject CDP remote object to be serialized.
     * @param resultOwnership indicates desired OwnershipModel.
     * @param realm
     */
    static async serializeCdpObject(cdpRemoteObject, resultOwnership, realm) {
        const arg = this.#cdpRemoteObjectToCallArgument(cdpRemoteObject);
        const cdpWebDriverValue = await realm.cdpClient.sendCommand('Runtime.callFunctionOn', {
            functionDeclaration: String((obj) => obj),
            awaitPromise: false,
            arguments: [arg],
            generateWebDriverValue: true,
            executionContextId: realm.executionContextId,
        });
        return await this.#cdpToBidiValue(cdpWebDriverValue, realm, resultOwnership);
    }
    static #cdpRemoteObjectToCallArgument(cdpRemoteObject) {
        if (cdpRemoteObject.objectId !== undefined) {
            return { objectId: cdpRemoteObject.objectId };
        }
        if (cdpRemoteObject.unserializableValue !== undefined) {
            return { unserializableValue: cdpRemoteObject.unserializableValue };
        }
        return { value: cdpRemoteObject.value };
    }
    /**
     * Gets the string representation of an object. This is equivalent to
     * calling toString() on the object value.
     * @param cdpObject CDP remote object representing an object.
     * @param realm
     * @returns string The stringified object.
     */
    static async stringifyObject(cdpObject, realm) {
        let stringifyResult = await realm.cdpClient.sendCommand('Runtime.callFunctionOn', {
            functionDeclaration: String(function (obj) {
                return String(obj);
            }),
            awaitPromise: false,
            arguments: [cdpObject],
            returnByValue: true,
            executionContextId: realm.executionContextId,
        });
        return stringifyResult.result.value;
    }
    static async callFunction(realm, functionDeclaration, _this, _arguments, awaitPromise, resultOwnership) {
        const callFunctionAndSerializeScript = `(...args)=>{ return _callFunction((\n${functionDeclaration}\n), args);
      function _callFunction(f, args) {
        const deserializedThis = args.shift();
        const deserializedArgs = args;
        return f.apply(deserializedThis, deserializedArgs);
      }}`;
        const thisAndArgumentsList = [
            await this.#deserializeToCdpArg(_this, realm),
        ];
        thisAndArgumentsList.push(...(await Promise.all(_arguments.map(async (a) => {
            return await this.#deserializeToCdpArg(a, realm);
        }))));
        let cdpCallFunctionResult;
        try {
            cdpCallFunctionResult = await realm.cdpClient.sendCommand('Runtime.callFunctionOn', {
                functionDeclaration: callFunctionAndSerializeScript,
                awaitPromise,
                arguments: thisAndArgumentsList,
                generateWebDriverValue: true,
                executionContextId: realm.executionContextId,
            });
        }
        catch (e) {
            // Heuristic to determine if the problem is in the argument.
            // The check can be done on the `deserialization` step, but this approach
            // helps to save round-trips.
            if (e.code === -32000 &&
                [
                    'Could not find object with given id',
                    'Argument should belong to the same JavaScript world as target object',
                ].includes(e.message)) {
                throw new protocol_js_1.Message.InvalidArgumentException('Handle was not found.');
            }
            throw e;
        }
        if (cdpCallFunctionResult.exceptionDetails) {
            // Serialize exception details.
            return {
                exceptionDetails: await this.#serializeCdpExceptionDetails(cdpCallFunctionResult.exceptionDetails, this.#callFunctionStacktraceLineOffset, resultOwnership, realm),
                type: 'exception',
                realm: realm.realmId,
            };
        }
        return {
            type: 'success',
            result: await ScriptEvaluator.#cdpToBidiValue(cdpCallFunctionResult, realm, resultOwnership),
            realm: realm.realmId,
        };
    }
    static realmDestroyed(realm) {
        return Array.from(this.#knownHandlesToRealm.entries())
            .filter(([, r]) => r === realm.realmId)
            .map(([h]) => this.#knownHandlesToRealm.delete(h));
    }
    static async disown(realm, handle) {
        // Disowning an object from different realm does nothing.
        if (ScriptEvaluator.#knownHandlesToRealm.get(handle) !== realm.realmId) {
            return;
        }
        try {
            await realm.cdpClient.sendCommand('Runtime.releaseObject', {
                objectId: handle,
            });
        }
        catch (e) {
            // Heuristic to determine if the problem is in the unknown handler.
            // Ignore the error if so.
            if (!(e.code === -32000 && e.message === 'Invalid remote object id')) {
                throw e;
            }
        }
        this.#knownHandlesToRealm.delete(handle);
    }
    static async #serializeCdpExceptionDetails(cdpExceptionDetails, lineOffset, resultOwnership, realm) {
        const callFrames = cdpExceptionDetails.stackTrace?.callFrames.map((frame) => ({
            url: frame.url,
            functionName: frame.functionName,
            // As `script.evaluate` wraps call into serialization script, so
            // `lineNumber` should be adjusted.
            lineNumber: frame.lineNumber - lineOffset,
            columnNumber: frame.columnNumber,
        }));
        const exception = await this.serializeCdpObject(
        // Exception should always be there.
        cdpExceptionDetails.exception, resultOwnership, realm);
        const text = await this.stringifyObject(cdpExceptionDetails.exception, realm);
        return {
            exception,
            columnNumber: cdpExceptionDetails.columnNumber,
            // As `script.evaluate` wraps call into serialization script, so
            // `lineNumber` should be adjusted.
            lineNumber: cdpExceptionDetails.lineNumber - lineOffset,
            stackTrace: {
                callFrames: callFrames || [],
            },
            text: text || cdpExceptionDetails.text,
        };
    }
    static async #cdpToBidiValue(cdpValue, realm, resultOwnership) {
        // This relies on the CDP to implement proper BiDi serialization, except
        // objectIds+handles.
        const cdpWebDriverValue = cdpValue.result.webDriverValue;
        if (!cdpValue.result.objectId) {
            return cdpWebDriverValue;
        }
        const objectId = cdpValue.result.objectId;
        const bidiValue = cdpWebDriverValue;
        if (resultOwnership === 'root') {
            bidiValue.handle = objectId;
            // Remember all the handles sent to client.
            this.#knownHandlesToRealm.set(objectId, realm.realmId);
        }
        else {
            await realm.cdpClient.sendCommand('Runtime.releaseObject', { objectId });
        }
        return bidiValue;
    }
    static async scriptEvaluate(realm, expression, awaitPromise, resultOwnership) {
        let cdpEvaluateResult = await realm.cdpClient.sendCommand('Runtime.evaluate', {
            contextId: realm.executionContextId,
            expression,
            awaitPromise,
            generateWebDriverValue: true,
        });
        if (cdpEvaluateResult.exceptionDetails) {
            // Serialize exception details.
            return {
                exceptionDetails: await this.#serializeCdpExceptionDetails(cdpEvaluateResult.exceptionDetails, this.#evaluateStacktraceLineOffset, resultOwnership, realm),
                type: 'exception',
                realm: realm.realmId,
            };
        }
        return {
            type: 'success',
            result: await ScriptEvaluator.#cdpToBidiValue(cdpEvaluateResult, realm, resultOwnership),
            realm: realm.realmId,
        };
    }
    static async #deserializeToCdpArg(argumentValue, realm) {
        if ('handle' in argumentValue) {
            return { objectId: argumentValue.handle };
        }
        switch (argumentValue.type) {
            // Primitive Protocol Value
            // https://w3c.github.io/webdriver-bidi/#data-types-protocolValue-primitiveProtocolValue
            case 'undefined': {
                return { unserializableValue: 'undefined' };
            }
            case 'null': {
                return { unserializableValue: 'null' };
            }
            case 'string': {
                return { value: argumentValue.value };
            }
            case 'number': {
                if (argumentValue.value === 'NaN') {
                    return { unserializableValue: 'NaN' };
                }
                else if (argumentValue.value === '-0') {
                    return { unserializableValue: '-0' };
                }
                else if (argumentValue.value === '+Infinity') {
                    return { unserializableValue: '+Infinity' };
                }
                else if (argumentValue.value === 'Infinity') {
                    return { unserializableValue: 'Infinity' };
                }
                else if (argumentValue.value === '-Infinity') {
                    return { unserializableValue: '-Infinity' };
                }
                else {
                    return {
                        value: argumentValue.value,
                    };
                }
            }
            case 'boolean': {
                return { value: !!argumentValue.value };
            }
            case 'bigint': {
                return {
                    unserializableValue: `BigInt(${JSON.stringify(argumentValue.value)})`,
                };
            }
            // Local Value
            // https://w3c.github.io/webdriver-bidi/#data-types-protocolValue-LocalValue
            case 'date': {
                return {
                    unserializableValue: `new Date(Date.parse(${JSON.stringify(argumentValue.value)}))`,
                };
            }
            case 'regexp': {
                return {
                    unserializableValue: `new RegExp(${JSON.stringify(argumentValue.value.pattern)}, ${JSON.stringify(argumentValue.value.flags)})`,
                };
            }
            case 'map': {
                // TODO(sadym): if non of the nested keys and values has remote
                //  reference, serialize to `unserializableValue` without CDP roundtrip.
                const keyValueArray = await this.#flattenKeyValuePairs(argumentValue.value, realm);
                let argEvalResult = await realm.cdpClient.sendCommand('Runtime.callFunctionOn', {
                    functionDeclaration: String(function (...args) {
                        const result = new Map();
                        for (let i = 0; i < args.length; i += 2) {
                            result.set(args[i], args[i + 1]);
                        }
                        return result;
                    }),
                    awaitPromise: false,
                    arguments: keyValueArray,
                    returnByValue: false,
                    executionContextId: realm.executionContextId,
                });
                // TODO(sadym): dispose nested objects.
                return { objectId: argEvalResult.result.objectId };
            }
            case 'object': {
                // TODO(sadym): if non of the nested keys and values has remote
                //  reference, serialize to `unserializableValue` without CDP roundtrip.
                const keyValueArray = await this.#flattenKeyValuePairs(argumentValue.value, realm);
                let argEvalResult = await realm.cdpClient.sendCommand('Runtime.callFunctionOn', {
                    functionDeclaration: String(function (...args) {
                        const result = {};
                        for (let i = 0; i < args.length; i += 2) {
                            // Key should be either `string`, `number`, or `symbol`.
                            const key = args[i];
                            result[key] = args[i + 1];
                        }
                        return result;
                    }),
                    awaitPromise: false,
                    arguments: keyValueArray,
                    returnByValue: false,
                    executionContextId: realm.executionContextId,
                });
                // TODO(sadym): dispose nested objects.
                return { objectId: argEvalResult.result.objectId };
            }
            case 'array': {
                // TODO(sadym): if non of the nested items has remote reference,
                //  serialize to `unserializableValue` without CDP roundtrip.
                const args = await ScriptEvaluator.#flattenValueList(argumentValue.value, realm);
                let argEvalResult = await realm.cdpClient.sendCommand('Runtime.callFunctionOn', {
                    functionDeclaration: String(function (...args) {
                        return args;
                    }),
                    awaitPromise: false,
                    arguments: args,
                    returnByValue: false,
                    executionContextId: realm.executionContextId,
                });
                // TODO(sadym): dispose nested objects.
                return { objectId: argEvalResult.result.objectId };
            }
            case 'set': {
                // TODO(sadym): if non of the nested items has remote reference,
                //  serialize to `unserializableValue` without CDP roundtrip.
                const args = await this.#flattenValueList(argumentValue.value, realm);
                let argEvalResult = await realm.cdpClient.sendCommand('Runtime.callFunctionOn', {
                    functionDeclaration: String(function (...args) {
                        return new Set(args);
                    }),
                    awaitPromise: false,
                    arguments: args,
                    returnByValue: false,
                    executionContextId: realm.executionContextId,
                });
                return { objectId: argEvalResult.result.objectId };
            }
            // TODO(sadym): dispose nested objects.
            default:
                throw new Error(`Value ${JSON.stringify(argumentValue)} is not deserializable.`);
        }
    }
    static async #flattenKeyValuePairs(value, realm) {
        const keyValueArray = [];
        for (let pair of value) {
            const key = pair[0];
            const value = pair[1];
            let keyArg, valueArg;
            if (typeof key === 'string') {
                // Key is a string.
                keyArg = { value: key };
            }
            else {
                // Key is a serialized value.
                keyArg = await this.#deserializeToCdpArg(key, realm);
            }
            valueArg = await this.#deserializeToCdpArg(value, realm);
            keyValueArray.push(keyArg);
            keyValueArray.push(valueArg);
        }
        return keyValueArray;
    }
    static async #flattenValueList(list, realm) {
        const result = [];
        for (let value of list) {
            result.push(await this.#deserializeToCdpArg(value, realm));
        }
        return result;
    }
}
exports.ScriptEvaluator = ScriptEvaluator;
//# sourceMappingURL=scriptEvaluator.js.map

/***/ }),

/***/ 315:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CDP = exports.Log = exports.BrowsingContext = exports.Message = void 0;
var Message;
(function (Message) {
    class ErrorResponseClass {
        constructor(error, message, stacktrace) {
            this.error = error;
            this.message = message;
            this.stacktrace = stacktrace;
        }
        error;
        message;
        stacktrace;
        toErrorResponse(commandId) {
            return {
                id: commandId,
                error: this.error,
                message: this.message,
                stacktrace: this.stacktrace,
            };
        }
    }
    Message.ErrorResponseClass = ErrorResponseClass;
    class UnknownException extends ErrorResponseClass {
        constructor(message, stacktrace) {
            super('unknown error', message, stacktrace);
        }
    }
    Message.UnknownException = UnknownException;
    class UnknownCommandException extends ErrorResponseClass {
        constructor(message, stacktrace) {
            super('unknown command', message, stacktrace);
        }
    }
    Message.UnknownCommandException = UnknownCommandException;
    class InvalidArgumentException extends ErrorResponseClass {
        constructor(message, stacktrace) {
            super('invalid argument', message, stacktrace);
        }
    }
    Message.InvalidArgumentException = InvalidArgumentException;
    class NoSuchFrameException extends ErrorResponseClass {
        constructor(message) {
            super('no such frame', message);
        }
    }
    Message.NoSuchFrameException = NoSuchFrameException;
})(Message = exports.Message || (exports.Message = {}));
// https://w3c.github.io/webdriver-bidi/#module-browsingContext
var BrowsingContext;
(function (BrowsingContext) {
    let EventNames;
    (function (EventNames) {
        EventNames["LoadEvent"] = "browsingContext.load";
        EventNames["DomContentLoadedEvent"] = "browsingContext.domContentLoaded";
        EventNames["ContextCreatedEvent"] = "browsingContext.contextCreated";
        EventNames["ContextDestroyedEvent"] = "browsingContext.contextDestroyed";
    })(EventNames = BrowsingContext.EventNames || (BrowsingContext.EventNames = {}));
})(BrowsingContext = exports.BrowsingContext || (exports.BrowsingContext = {}));
// https://w3c.github.io/webdriver-bidi/#module-log
var Log;
(function (Log) {
    let EventNames;
    (function (EventNames) {
        EventNames["LogEntryAddedEvent"] = "log.entryAdded";
    })(EventNames = Log.EventNames || (Log.EventNames = {}));
})(Log = exports.Log || (exports.Log = {}));
var CDP;
(function (CDP) {
    let EventNames;
    (function (EventNames) {
        EventNames["EventReceivedEvent"] = "cdp.eventReceived";
    })(EventNames = CDP.EventNames || (CDP.EventNames = {}));
})(CDP = exports.CDP || (exports.CDP = {}));
//# sourceMappingURL=protocol.js.map

/***/ }),

/***/ 6111:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventEmitter = void 0;
const mitt_1 = __importDefault(__webpack_require__(487));
class EventEmitter {
    #emitter = (0, mitt_1.default)();
    on(type, handler) {
        this.#emitter.on(type, handler);
        return this;
    }
    /**
     * Like `on` but the listener will only be fired once and then it will be removed.
     * @param event - the event you'd like to listen to
     * @param handler - the handler function to run when the event occurs
     * @returns `this` to enable you to chain method calls.
     */
    once(event, handler) {
        const onceHandler = (eventData) => {
            handler(eventData);
            this.off(event, onceHandler);
        };
        return this.on(event, onceHandler);
    }
    off(type, handler) {
        this.#emitter.off(type, handler);
        return this;
    }
    /**
     * Emits an event and call any associated listeners.
     *
     * @param event - the event you'd like to emit
     * @param eventData - any data you'd like to emit with the event
     * @returns `true` if there are any listeners, `false` if there are not.
     */
    emit(event, eventData) {
        this.#emitter.emit(event, eventData);
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map

/***/ }),

/***/ 5860:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Buffer = void 0;
/**
 * Implements a FIFO buffer with a fixed size.
 */
class Buffer {
    #capacity;
    #entries = [];
    #onItemRemoved;
    /**
     * @param capacity
     * @param onItemRemoved optional delegate called for each removed element.
     */
    constructor(capacity, onItemRemoved = () => { }) {
        this.#capacity = capacity;
        this.#onItemRemoved = onItemRemoved;
    }
    get() {
        return this.#entries;
    }
    add(value) {
        this.#entries.push(value);
        while (this.#entries.length > this.#capacity) {
            const item = this.#entries.shift();
            if (item !== undefined) {
                this.#onItemRemoved(item);
            }
        }
    }
}
exports.Buffer = Buffer;
//# sourceMappingURL=buffer.js.map

/***/ }),

/***/ 3343:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Deferred = void 0;
class Deferred {
    #resolve = () => { };
    #reject = () => { };
    #promise;
    #isFinished = false;
    get isFinished() {
        return this.#isFinished;
    }
    constructor() {
        this.#promise = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
    }
    then(onFulfilled, onRejected) {
        return this.#promise.then(onFulfilled, onRejected);
    }
    catch(onRejected) {
        return this.#promise.catch(onRejected);
    }
    resolve(value) {
        this.#isFinished = true;
        this.#resolve(value);
    }
    reject(reason) {
        this.#isFinished = true;
        this.#reject(reason);
    }
    finally(onFinally) {
        return this.#promise.finally(onFinally);
    }
    [Symbol.toStringTag] = 'Promise';
}
exports.Deferred = Deferred;
//# sourceMappingURL=deferred.js.map

/***/ }),

/***/ 3018:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IdWrapper = void 0;
/**
 * Creates an object with a positive unique incrementing id.
 */
class IdWrapper {
    static #counter = 0;
    #id;
    constructor() {
        this.#id = ++IdWrapper.#counter;
    }
    get id() {
        return this.#id;
    }
}
exports.IdWrapper = IdWrapper;
//# sourceMappingURL=idWrapper.js.map

/***/ }),

/***/ 5598:
/***/ ((__unused_webpack_module, exports) => {


/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.log = exports.LogType = void 0;
var LogType;
(function (LogType) {
    LogType["system"] = "System";
    LogType["bidi"] = "BiDi Messages";
    LogType["browsingContexts"] = "Browsing Contexts";
    LogType["cdp"] = "CDP";
    LogType["commandParser"] = "Command parser";
})(LogType = exports.LogType || (exports.LogType = {}));
function log(logType) {
    return (...messages) => {
        console.log(logType, ...messages);
        // Add messages to the Mapper Tab Page, if exists.
        // Dynamic lookup to avoid circlular dependency.
        if ('MapperTabPage' in globalThis) {
            globalThis['MapperTabPage'].log(logType, ...messages);
        }
    };
}
exports.log = log;
//# sourceMappingURL=log.js.map

/***/ }),

/***/ 9300:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProcessingQueue = void 0;
const log_js_1 = __webpack_require__(5598);
/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const logSystem = (0, log_js_1.log)(log_js_1.LogType.system);
class ProcessingQueue {
    #queue = [];
    #processor;
    #catch;
    // Flag to keep only 1 active processor.
    #isProcessing = false;
    constructor(processor, _catch = () => Promise.resolve()) {
        this.#catch = _catch;
        this.#processor = processor;
    }
    add(entry) {
        this.#queue.push(entry);
        // No need in waiting. Just initialise processor if needed.
        // noinspection JSIgnoredPromiseFromCall
        this.#processIfNeeded();
    }
    async #processIfNeeded() {
        if (this.#isProcessing) {
            return;
        }
        this.#isProcessing = true;
        while (this.#queue.length > 0) {
            const entryPromise = this.#queue.shift();
            if (entryPromise !== undefined) {
                await entryPromise
                    .then((entry) => this.#processor(entry))
                    .catch((e) => {
                    logSystem('Event was not processed:' + e);
                    this.#catch(e);
                })
                    .finally();
            }
        }
        this.#isProcessing = false;
    }
}
exports.ProcessingQueue = ProcessingQueue;
//# sourceMappingURL=processingQueue.js.map

/***/ }),

/***/ 487:
/***/ ((module) => {

module.exports = eval("require")("mitt");


/***/ }),

/***/ 6728:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Browser": () => (/* reexport */ Browser),
  "BrowserContext": () => (/* reexport */ BrowserContext),
  "Connection": () => (/* reexport */ Connection),
  "Page": () => (/* reexport */ Page),
  "connectBidiOverCDP": () => (/* reexport */ connectBidiOverCDP)
});

// EXTERNAL MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/api/Browser.js
var api_Browser = __webpack_require__(6468);
// EXTERNAL MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/api/BrowserContext.js
var api_BrowserContext = __webpack_require__(5786);
// EXTERNAL MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/api/Page.js
var api_Page = __webpack_require__(3297);
// EXTERNAL MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/util.js
var util = __webpack_require__(1823);
;// CONCATENATED MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/bidi/Serializer.js

/**
 * @internal
 */
class UnserializableError extends Error {
}
/**
 * @internal
 */
class BidiSerializer {
    static serializeNumber(arg) {
        let value;
        if (Object.is(arg, -0)) {
            value = '-0';
        }
        else if (Object.is(arg, Infinity)) {
            value = 'Infinity';
        }
        else if (Object.is(arg, -Infinity)) {
            value = '-Infinity';
        }
        else if (Object.is(arg, NaN)) {
            value = 'NaN';
        }
        else {
            value = arg;
        }
        return {
            type: 'number',
            value,
        };
    }
    static serializeObject(arg) {
        if (arg === null) {
            return {
                type: 'null',
            };
        }
        else if (Array.isArray(arg)) {
            const parsedArray = arg.map(subArg => {
                return BidiSerializer.serializeRemoveValue(subArg);
            });
            return {
                type: 'array',
                value: parsedArray,
            };
        }
        else if ((0,util/* isPlainObject */.PO)(arg)) {
            const parsedObject = [];
            for (const key in arg) {
                parsedObject.push([
                    BidiSerializer.serializeRemoveValue(key),
                    BidiSerializer.serializeRemoveValue(arg[key]),
                ]);
            }
            return {
                type: 'object',
                value: parsedObject,
            };
        }
        else if ((0,util/* isRegExp */.Kj)(arg)) {
            return {
                type: 'regexp',
                value: {
                    pattern: arg.source,
                    flags: arg.flags,
                },
            };
        }
        else if ((0,util/* isDate */.J_)(arg)) {
            return {
                type: 'date',
                value: arg.toISOString(),
            };
        }
        throw new UnserializableError('Custom object sterilization not possible. Use plain objects instead.');
    }
    static serializeRemoveValue(arg) {
        switch (typeof arg) {
            case 'symbol':
            case 'function':
                throw new UnserializableError(`Unable to serializable ${typeof arg}`);
            case 'object':
                return BidiSerializer.serializeObject(arg);
            case 'undefined':
                return {
                    type: 'undefined',
                };
            case 'number':
                return BidiSerializer.serializeNumber(arg);
            case 'bigint':
                return {
                    type: 'bigint',
                    value: arg.toString(),
                };
            case 'string':
                return {
                    type: 'string',
                    value: arg,
                };
            case 'boolean':
                return {
                    type: 'boolean',
                    value: arg,
                };
        }
    }
    static serialize(arg) {
        // TODO: See use case of LazyArgs
        return BidiSerializer.serializeRemoveValue(arg);
    }
    static deserializeNumber(value) {
        switch (value) {
            case '-0':
                return -0;
            case 'NaN':
                return NaN;
            case 'Infinity':
            case '+Infinity':
                return Infinity;
            case '-Infinity':
                return -Infinity;
            default:
                return value;
        }
    }
    static deserializeLocalValue(result) {
        var _a;
        switch (result.type) {
            case 'array':
                // TODO: Check expected output when value is undefined
                return (_a = result.value) === null || _a === void 0 ? void 0 : _a.map(value => {
                    return BidiSerializer.deserializeLocalValue(value);
                });
            case 'set':
                // TODO: Check expected output when value is undefined
                return result.value.reduce((acc, value) => {
                    return acc.add(value);
                }, new Set());
            case 'object':
                if (result.value) {
                    return result.value.reduce((acc, tuple) => {
                        const { key, value } = BidiSerializer.deserializeTuple(tuple);
                        acc[key] = value;
                        return acc;
                    }, {});
                }
                break;
            case 'map':
                return result.value.reduce((acc, tuple) => {
                    const { key, value } = BidiSerializer.deserializeTuple(tuple);
                    return acc.set(key, value);
                }, new Map());
            case 'promise':
                return {};
            case 'regexp':
                return new RegExp(result.value.pattern, result.value.flags);
            case 'date':
                return new Date(result.value);
            case 'undefined':
                return undefined;
            case 'null':
                return null;
            case 'number':
                return BidiSerializer.deserializeNumber(result.value);
            case 'bigint':
                return BigInt(result.value);
            case 'boolean':
                return Boolean(result.value);
            case 'string':
                return result.value;
        }
        throw new UnserializableError(`Deserialization of type ${result.type} not supported.`);
    }
    static deserializeTuple([serializedKey, serializedValue]) {
        const key = typeof serializedKey === 'string'
            ? serializedKey
            : BidiSerializer.deserializeLocalValue(serializedKey);
        const value = BidiSerializer.deserializeLocalValue(serializedValue);
        return { key, value };
    }
    static deserialize(result) {
        if (!result) {
            (0,util/* debugError */.ur)('Service did not produce a result.');
            return undefined;
        }
        try {
            return BidiSerializer.deserializeLocalValue(result);
        }
        catch (error) {
            if (error instanceof UnserializableError) {
                (0,util/* debugError */.ur)(error.message);
                return undefined;
            }
            throw error;
        }
    }
}
//# sourceMappingURL=Serializer.js.map
;// CONCATENATED MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/bidi/Page.js
/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Page_connection, _Page_contextId;



/**
 * @internal
 */
class Page extends api_Page/* Page */.T3 {
    constructor(connection, contextId) {
        super();
        _Page_connection.set(this, void 0);
        _Page_contextId.set(this, void 0);
        __classPrivateFieldSet(this, _Page_connection, connection, "f");
        __classPrivateFieldSet(this, _Page_contextId, contextId, "f");
    }
    async close() {
        await __classPrivateFieldGet(this, _Page_connection, "f").send('browsingContext.close', {
            context: __classPrivateFieldGet(this, _Page_contextId, "f"),
        });
    }
    async evaluate(pageFunction, ...args) {
        let responsePromise;
        if ((0,util/* isString */.HD)(pageFunction)) {
            responsePromise = __classPrivateFieldGet(this, _Page_connection, "f").send('script.evaluate', {
                expression: pageFunction,
                target: { context: __classPrivateFieldGet(this, _Page_contextId, "f") },
                awaitPromise: true,
            });
        }
        else {
            responsePromise = __classPrivateFieldGet(this, _Page_connection, "f").send('script.callFunction', {
                functionDeclaration: (0,util/* stringifyFunction */.D)(pageFunction),
                arguments: await Promise.all(args.map(BidiSerializer.serialize)),
                target: { context: __classPrivateFieldGet(this, _Page_contextId, "f") },
                awaitPromise: true,
            });
        }
        const { result } = await responsePromise;
        if ('type' in result && result.type === 'exception') {
            throw new Error(result.exceptionDetails.text);
        }
        return BidiSerializer.deserialize(result.result);
    }
}
_Page_connection = new WeakMap(), _Page_contextId = new WeakMap();
//# sourceMappingURL=Page.js.map
;// CONCATENATED MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/bidi/BrowserContext.js
/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var BrowserContext_classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var BrowserContext_classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BrowserContext_connection;


/**
 * @internal
 */
class BrowserContext extends api_BrowserContext/* BrowserContext */._ {
    constructor(connection) {
        super();
        _BrowserContext_connection.set(this, void 0);
        BrowserContext_classPrivateFieldSet(this, _BrowserContext_connection, connection, "f");
    }
    async newPage() {
        const response = await BrowserContext_classPrivateFieldGet(this, _BrowserContext_connection, "f").send('browsingContext.create', {
            type: 'tab',
        });
        return new Page(BrowserContext_classPrivateFieldGet(this, _BrowserContext_connection, "f"), response.result.context);
    }
    async close() { }
}
_BrowserContext_connection = new WeakMap();
//# sourceMappingURL=BrowserContext.js.map
;// CONCATENATED MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/bidi/Browser.js
/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Browser_classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var Browser_classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Browser_process, _Browser_closeCallback, _Browser_connection;


/**
 * @internal
 */
class Browser extends api_Browser/* Browser */.A {
    /**
     * @internal
     */
    static async create(opts) {
        // TODO: await until the connection is established.
        try {
            // TODO: Add 'session.new' to BiDi types
            (await opts.connection.send('session.new', {}));
        }
        catch { }
        return new Browser(opts);
    }
    /**
     * @internal
     */
    constructor(opts) {
        super();
        _Browser_process.set(this, void 0);
        _Browser_closeCallback.set(this, void 0);
        _Browser_connection.set(this, void 0);
        Browser_classPrivateFieldSet(this, _Browser_process, opts.process, "f");
        Browser_classPrivateFieldSet(this, _Browser_closeCallback, opts.closeCallback, "f");
        Browser_classPrivateFieldSet(this, _Browser_connection, opts.connection, "f");
    }
    async close() {
        var _a;
        Browser_classPrivateFieldGet(this, _Browser_connection, "f").dispose();
        await ((_a = Browser_classPrivateFieldGet(this, _Browser_closeCallback, "f")) === null || _a === void 0 ? void 0 : _a.call(null));
    }
    isConnected() {
        return !Browser_classPrivateFieldGet(this, _Browser_connection, "f").closed;
    }
    process() {
        var _a;
        return (_a = Browser_classPrivateFieldGet(this, _Browser_process, "f")) !== null && _a !== void 0 ? _a : null;
    }
    async createIncognitoBrowserContext(_options) {
        return new BrowserContext(Browser_classPrivateFieldGet(this, _Browser_connection, "f"));
    }
}
_Browser_process = new WeakMap(), _Browser_closeCallback = new WeakMap(), _Browser_connection = new WeakMap();
//# sourceMappingURL=Browser.js.map
// EXTERNAL MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/Debug.js
var Debug = __webpack_require__(8528);
// EXTERNAL MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/EventEmitter.js + 1 modules
var EventEmitter = __webpack_require__(8856);
// EXTERNAL MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/Errors.js
var Errors = __webpack_require__(7154);
;// CONCATENATED MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/bidi/Connection.js
/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Connection_classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var Connection_classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Connection_instances, _Connection_transport, _Connection_delay, _Connection_lastId, _Connection_closed, _Connection_callbacks, _Connection_onClose;

const debugProtocolSend = (0,Debug/* debug */.fF)('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = (0,Debug/* debug */.fF)('puppeteer:webDriverBiDi:RECV ◀');


/**
 * @internal
 */
class Connection extends EventEmitter/* EventEmitter */.v {
    constructor(transport, delay = 0) {
        super();
        _Connection_instances.add(this);
        _Connection_transport.set(this, void 0);
        _Connection_delay.set(this, void 0);
        _Connection_lastId.set(this, 0);
        _Connection_closed.set(this, false);
        _Connection_callbacks.set(this, new Map());
        Connection_classPrivateFieldSet(this, _Connection_delay, delay, "f");
        Connection_classPrivateFieldSet(this, _Connection_transport, transport, "f");
        Connection_classPrivateFieldGet(this, _Connection_transport, "f").onmessage = this.onMessage.bind(this);
        Connection_classPrivateFieldGet(this, _Connection_transport, "f").onclose = Connection_classPrivateFieldGet(this, _Connection_instances, "m", _Connection_onClose).bind(this);
    }
    get closed() {
        return Connection_classPrivateFieldGet(this, _Connection_closed, "f");
    }
    send(method, params) {
        var _a;
        const id = Connection_classPrivateFieldSet(this, _Connection_lastId, (_a = Connection_classPrivateFieldGet(this, _Connection_lastId, "f"), ++_a), "f");
        const stringifiedMessage = JSON.stringify({
            id,
            method,
            params,
        });
        debugProtocolSend(stringifiedMessage);
        Connection_classPrivateFieldGet(this, _Connection_transport, "f").send(stringifiedMessage);
        return new Promise((resolve, reject) => {
            Connection_classPrivateFieldGet(this, _Connection_callbacks, "f").set(id, {
                resolve,
                reject,
                error: new Errors/* ProtocolError */.K1(),
                method,
            });
        });
    }
    /**
     * @internal
     */
    async onMessage(message) {
        if (Connection_classPrivateFieldGet(this, _Connection_delay, "f")) {
            await new Promise(f => {
                return setTimeout(f, Connection_classPrivateFieldGet(this, _Connection_delay, "f"));
            });
        }
        debugProtocolReceive(message);
        const object = JSON.parse(message);
        if ('id' in object) {
            const callback = Connection_classPrivateFieldGet(this, _Connection_callbacks, "f").get(object.id);
            // Callbacks could be all rejected if someone has called `.dispose()`.
            if (callback) {
                Connection_classPrivateFieldGet(this, _Connection_callbacks, "f").delete(object.id);
                if ('error' in object) {
                    callback.reject(createProtocolError(callback.error, callback.method, object));
                }
                else {
                    callback.resolve(object);
                }
            }
        }
        else {
            this.emit(object.method, object.params);
        }
    }
    dispose() {
        Connection_classPrivateFieldGet(this, _Connection_instances, "m", _Connection_onClose).call(this);
        Connection_classPrivateFieldGet(this, _Connection_transport, "f").close();
    }
}
_Connection_transport = new WeakMap(), _Connection_delay = new WeakMap(), _Connection_lastId = new WeakMap(), _Connection_closed = new WeakMap(), _Connection_callbacks = new WeakMap(), _Connection_instances = new WeakSet(), _Connection_onClose = function _Connection_onClose() {
    if (Connection_classPrivateFieldGet(this, _Connection_closed, "f")) {
        return;
    }
    Connection_classPrivateFieldSet(this, _Connection_closed, true, "f");
    Connection_classPrivateFieldGet(this, _Connection_transport, "f").onmessage = undefined;
    Connection_classPrivateFieldGet(this, _Connection_transport, "f").onclose = undefined;
    for (const callback of Connection_classPrivateFieldGet(this, _Connection_callbacks, "f").values()) {
        callback.reject(rewriteError(callback.error, `Protocol error (${callback.method}): Connection closed.`));
    }
    Connection_classPrivateFieldGet(this, _Connection_callbacks, "f").clear();
};
function rewriteError(error, message, originalMessage) {
    error.message = message;
    error.originalMessage = originalMessage !== null && originalMessage !== void 0 ? originalMessage : error.originalMessage;
    return error;
}
/**
 * @internal
 */
function createProtocolError(error, method, object) {
    let message = `Protocol error (${method}): ${object.error} ${object.message}`;
    if (object.stacktrace) {
        message += ` ${object.stacktrace}`;
    }
    return rewriteError(error, message, object.message);
}
//# sourceMappingURL=Connection.js.map
// EXTERNAL MODULE: ./node_modules/chromium-bidi/lib/cjs/bidiMapper/bidiMapper.js
var bidiMapper = __webpack_require__(1796);
;// CONCATENATED MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/bidi/BidiOverCDP.js
var BidiOverCDP_classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var BidiOverCDP_classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CDPConnectionAdapter_cdp, _CDPConnectionAdapter_adapters, _CDPConnectionAdapter_browser, _CDPClientAdapter_closed, _CDPClientAdapter_client, _CDPClientAdapter_forwardMessage, _NoOpTransport_onMessage;


/**
 * @internal
 */
async function connectBidiOverCDP(cdp) {
    const transportBiDi = new NoOpTransport();
    const cdpConnectionAdapter = new CDPConnectionAdapter(cdp);
    const pptrTransport = {
        send(message) {
            // Forwards a BiDi command sent by Puppeteer to the input of the BidiServer.
            transportBiDi.emitMessage(JSON.parse(message));
        },
        close() {
            bidiServer.close();
            cdpConnectionAdapter.close();
        },
        onmessage(_message) {
            // The method is overridden by the Connection.
        },
    };
    transportBiDi.on('bidiResponse', (message) => {
        // Forwards a BiDi event sent by BidiServer to Puppeteer.
        pptrTransport.onmessage(JSON.stringify(message));
    });
    const pptrBiDiConnection = new Connection(pptrTransport);
    const bidiServer = await bidiMapper/* BidiServer.createAndStart */.$z.createAndStart(transportBiDi, cdpConnectionAdapter, '');
    return pptrBiDiConnection;
}
/**
 * Manages CDPSessions for BidiServer.
 * @internal
 */
class CDPConnectionAdapter {
    constructor(cdp) {
        _CDPConnectionAdapter_cdp.set(this, void 0);
        _CDPConnectionAdapter_adapters.set(this, new Map());
        _CDPConnectionAdapter_browser.set(this, void 0);
        BidiOverCDP_classPrivateFieldSet(this, _CDPConnectionAdapter_cdp, cdp, "f");
        BidiOverCDP_classPrivateFieldSet(this, _CDPConnectionAdapter_browser, new CDPClientAdapter(cdp), "f");
    }
    browserClient() {
        return BidiOverCDP_classPrivateFieldGet(this, _CDPConnectionAdapter_browser, "f");
    }
    getCdpClient(id) {
        const session = BidiOverCDP_classPrivateFieldGet(this, _CDPConnectionAdapter_cdp, "f").session(id);
        if (!session) {
            throw new Error('Unknown CDP session with id' + id);
        }
        if (!BidiOverCDP_classPrivateFieldGet(this, _CDPConnectionAdapter_adapters, "f").has(session)) {
            const adapter = new CDPClientAdapter(session);
            BidiOverCDP_classPrivateFieldGet(this, _CDPConnectionAdapter_adapters, "f").set(session, adapter);
            return adapter;
        }
        return BidiOverCDP_classPrivateFieldGet(this, _CDPConnectionAdapter_adapters, "f").get(session);
    }
    close() {
        BidiOverCDP_classPrivateFieldGet(this, _CDPConnectionAdapter_browser, "f").close();
        for (const adapter of BidiOverCDP_classPrivateFieldGet(this, _CDPConnectionAdapter_adapters, "f").values()) {
            adapter.close();
        }
    }
}
_CDPConnectionAdapter_cdp = new WeakMap(), _CDPConnectionAdapter_adapters = new WeakMap(), _CDPConnectionAdapter_browser = new WeakMap();
/**
 * Wrapper on top of CDPSession/CDPConnection to satisfy CDP interface that
 * BidiServer needs.
 *
 * @internal
 */
class CDPClientAdapter extends bidiMapper/* EventEmitter */.vp {
    constructor(client) {
        super();
        _CDPClientAdapter_closed.set(this, false);
        _CDPClientAdapter_client.set(this, void 0);
        _CDPClientAdapter_forwardMessage.set(this, (method, event) => {
            this.emit(method, event);
        });
        BidiOverCDP_classPrivateFieldSet(this, _CDPClientAdapter_client, client, "f");
        BidiOverCDP_classPrivateFieldGet(this, _CDPClientAdapter_client, "f").on('*', BidiOverCDP_classPrivateFieldGet(this, _CDPClientAdapter_forwardMessage, "f"));
    }
    async sendCommand(method, ...params) {
        if (BidiOverCDP_classPrivateFieldGet(this, _CDPClientAdapter_closed, "f")) {
            return;
        }
        try {
            return await BidiOverCDP_classPrivateFieldGet(this, _CDPClientAdapter_client, "f").send(method, ...params);
        }
        catch (err) {
            if (BidiOverCDP_classPrivateFieldGet(this, _CDPClientAdapter_closed, "f")) {
                return;
            }
            throw err;
        }
    }
    close() {
        BidiOverCDP_classPrivateFieldGet(this, _CDPClientAdapter_client, "f").off('*', BidiOverCDP_classPrivateFieldGet(this, _CDPClientAdapter_forwardMessage, "f"));
        BidiOverCDP_classPrivateFieldSet(this, _CDPClientAdapter_closed, true, "f");
    }
}
_CDPClientAdapter_closed = new WeakMap(), _CDPClientAdapter_client = new WeakMap(), _CDPClientAdapter_forwardMessage = new WeakMap();
/**
 * This transport is given to the BiDi server instance and allows Puppeteer
 * to send and receive commands to the BiDiServer.
 * @internal
 */
class NoOpTransport extends bidiMapper/* EventEmitter */.vp {
    constructor() {
        super(...arguments);
        _NoOpTransport_onMessage.set(this, async (_m) => {
            return;
        });
    }
    emitMessage(message) {
        BidiOverCDP_classPrivateFieldGet(this, _NoOpTransport_onMessage, "f").call(this, message);
    }
    setOnMessage(onMessage) {
        BidiOverCDP_classPrivateFieldSet(this, _NoOpTransport_onMessage, onMessage, "f");
    }
    async sendMessage(message) {
        this.emit('bidiResponse', message);
    }
    close() {
        BidiOverCDP_classPrivateFieldSet(this, _NoOpTransport_onMessage, async (_m) => {
            return;
        }, "f");
    }
}
_NoOpTransport_onMessage = new WeakMap();
//# sourceMappingURL=BidiOverCDP.js.map
;// CONCATENATED MODULE: ./node_modules/puppeteer-core/lib/esm/puppeteer/common/bidi/bidi.js
/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */





//# sourceMappingURL=bidi.js.map

/***/ })

};
