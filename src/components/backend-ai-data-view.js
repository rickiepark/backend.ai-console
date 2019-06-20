/**
 @license
 Copyright (c) 2015-2019 Lablup Inc. All rights reserved.
 */

import {css, html, LitElement} from "lit-element";
import {render} from 'lit-html';

import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/iron-flex-layout/iron-flex-layout';
import '@polymer/iron-flex-layout/iron-flex-layout-classes';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-styles/typography';
import '@polymer/paper-styles/color';
import '@polymer/paper-item/paper-item.js';
import './lablup-loading-indicator';
import '@polymer/paper-listbox/paper-listbox';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu';

import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-grid/vaadin-grid-sorter.js';
import '@vaadin/vaadin-grid/vaadin-grid-sort-column.js';
import '@vaadin/vaadin-item/vaadin-item.js';
import '@vaadin/vaadin-upload/vaadin-upload.js';

import 'weightless/button';
import 'weightless/icon';
import 'weightless/card';
import 'weightless/dialog';

import './lablup-notification.js';
import '../lablup-activity-panel.js';
import '../plastics/lablup-shields/lablup-shields';

import {BackendAiStyles} from "./backend-ai-console-styles";
import {IronFlex, IronFlexAlignment, IronFlexFactors, IronPositioning} from "../layout/iron-flex-layout-classes";

class BackendAIData extends LitElement {
  constructor() {
    super();
    // Resolve warning about scroll performance
    // See https://developers.google.com/web/updates/2016/06/passive-event-listeners
    this.folders = {};
    this.folderInfo = {};
    this.is_admin = false;
    this.authenticated = false;
    this.deleteFolderId = '';
    this.active = false;
    this.explorer = {};
    this.explorerFiles = [];
    this.uploadFiles = [];
    this.vhost = 'local';
    this.vhosts = ['local'];
    this._boundIndexRenderer = this.indexRenderer.bind(this);
    this._boundControlFolderListRenderer = this.controlFolderListRenderer.bind(this);
    this._boundControlFileListRenderer = this.controlFileListRenderer.bind(this);
    this._boundPermissionViewRenderer = this.permissionViewRenderer.bind(this);
  }

  static get properties() {
    return {
      folders: {
        type: Object
      },
      folderInfo: {
        type: Object
      },
      is_admin: {
        type: Boolean
      },
      authenticated: {
        type: Boolean
      },
      deleteFolderId: {
        type: String
      },
      active: {
        type: Boolean
      },
      explorer: {
        type: Object
      },
      explorerFiles: {
        type: Array
      },
      uploadFiles: {
        type: Array
      },
      vhost: {
        type: String
      },
      vhosts: {
        type: Array
      }
    };
  }

  attributeChangedCallback(name, oldval, newval) {
    if (name == 'active' && newval !== null) {
      this._menuChanged(true);
    } else {
      this._menuChanged(false);
    }
    super.attributeChangedCallback(name, oldval, newval);
  }

  static get styles() {
    return [
      BackendAiStyles,
      IronFlex,
      IronFlexAlignment,
      IronPositioning,
      // language=CSS
      css`
        vaadin-grid {
          border: 0 !important;
          font-size: 12px;
        }

        ul {
          padding-left: 0;
        }

        ul li {
          list-style: none;
          font-size: 13px;
        }

        span.indicator {
          width: 100px;
        }

        wl-button.button {
          width: 330px;
        }

        paper-icon-button.tiny {
          width: 35px;
          height: 35px;
        }

        .warning {
          color: red;
        }

        vaadin-item {
          font-size: 13px;
          font-weight: 100;
        }

        #folder-explorer-dialog {
          --dialog-height: calc(100vh - 120px);
          height: calc(100vh - 120px);
          right: 0;
          top: 0;
          position: fixed;
          margin: 120px 0 0 0;
        }

        @media screen and (max-width: 899px) {
          #folder-explorer-dialog {
            left: 0;
            --dialog-width: 100%;
            width: 100%;
          }
        }

        @media screen and (min-width: 900px) {
          #folder-explorer-dialog {
            left: 150px;
            --dialog-width: calc(100% - 100px);
            width: calc(100% - 100px);
          }
        }

        div.breadcrumb {
          color: #637282;
          font-size: 1em;
        }

        div.breadcrumb span:first-child {
          display: none;
        }

        vaadin-grid.explorer {
          border: 0;
          font-size: 14px;
          height: calc(100vh - 320px);
        }

        wl-button.goto {
          margin: 0;
          padding: 5px;
          min-width: 0;
        }

        wl-button.goto:last-of-type {
          font-weight: bold;
        }

        div#upload {
          margin: 0;
          padding: 0;
        }

        div#dropzone {
          display: none;
          position: absolute;
          top: 0;
          height: 100%;
          width: 100%;
          z-index: 10;
        }

        div#dropzone, div#dropzone p {
          margin: 0;
          padding: 0;
          width: 100%;
          background: rgba(211, 211, 211, .5);
          text-align: center;
        }

        .progress {
          padding: 30px 10px;
          border: 1px solid lightgray;
        }

        .progress-item {
          padding: 10px 30px;
        }

        wl-button {
          --button-bg: var(--paper-orange-50);
          --button-bg-hover: var(--paper-orange-100);
          --button-bg-active: var(--paper-orange-600);
          color: var(--paper-orange-900);
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <lablup-notification id="notification"></lablup-notification>
      <lablup-loading-indicator id="loading-indicator"></lablup-loading-indicator>
      <wl-card class="item" elevation="1" style="padding-bottom:20px;">
        <h3 class="horizontal center flex layout">
          <span>Folders</span>
          <span class="flex"></span>
          <wl-button class="fg red" id="add-folder" outlined @click="${(e) => this._addFolderDialog(e)}">
            <wl-icon>add</wl-icon>
            New folder
          </wl-button>
        </h3>

        <vaadin-grid theme="row-stripes column-borders compact" aria-label="Folder list" .items="${this.folders}">
          <vaadin-grid-column width="40px" flex-grow="0" resizable header="#" .renderer="${this._boundIndexRenderer}">
          </vaadin-grid-column>

          <vaadin-grid-column resizable header="Name">
            <template>
              <div class="indicator" @click="[[_folderExplorer()]]" .folder-id="[[item.name]]">[[item.name]]</div>
            </template>
          </vaadin-grid-column>

          <vaadin-grid-column resizable>
            <template class="header">id</template>
            <template>
              <div class="layout vertical">
                <span>[[item.id]]</span>
              </div>
            </template>
          </vaadin-grid-column>

          <vaadin-grid-column width="85px" flex-grow="0" resizable>
            <template class="header">Location</template>
            <template>
              <div class="layout vertical">
                <span>[[item.host]]</span>
              </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column width="85px" flex-grow="0" resizable header="Permission" .renderer="${this._boundPermissionViewRenderer}"></vaadin-grid-column>
          <vaadin-grid-column resizable header="Control" .renderer="${this._boundControlFolderListRenderer}"></vaadin-grid-column>
        </vaadin-grid>
      </wl-card>
      <wl-card>
        <h4 class="horizontal center layout">
          <span>Public Data</span>
        </h4>
        <div class="horizontal center flex layout" style="padding:15px;">
          <div>No data present.</div>
        </div>
      </wl-card>
      <wl-dialog id="add-folder-dialog" class="dialog-ask" fixed backdrop blockscrolling>
        <wl-card elevation="1" class="login-panel intro centered">
          <h3 class="horizontal center layout">
            <span>Create a new virtual folder</span>
            <div class="flex"></div>
            <wl-button fab flat inverted @click="${(e) => this._hideDialog(e)}">
              <wl-icon>close</wl-icon>
            </wl-button>
          </h3>
          <section>
            <paper-input id="add-folder-name" label="Folder name" pattern="[a-zA-Z0-9_-]*"
                         error-message="Allows letters, numbers and -_." auto-validate></paper-input>
            <paper-dropdown-menu id="add-folder-host" label="Host">
              <paper-listbox slot="dropdown-content" selected="0">
                <template is="dom-repeat" items="[[ vhosts ]]">
                  <paper-item id="[[ item ]]" label="[[ item ]]">[[ item ]]</paper-item>
                </template>
              </paper-listbox>
            </paper-dropdown-menu>
            <br/>
            <wl-button class="blue button" type="button" id="add-button" outlined @click="${(e) => this._addFolder(e)}">
              <wl-icon>rowing</wl-icon>
              Create
            </wl-button>
          </section>
        </wl-card>
      </wl-dialog>
      <wl-dialog id="delete-folder-dialog" class="dialog-ask" fixed backdrop blockscrolling>
        <wl-card class="login-panel intro centered">
          <h3 class="horizontal center layout">
            <span>Delete a virtual folder</span>
            <div class="flex"></div>
            <wl-button fab flat inverted @click="${(e) => this._hideDialog(e)}">
              <wl-icon>close</wl-icon>
            </wl-button>
          </h3>
          <section>
            <div class="warning">WARNING: this cannot be undone!</div>
            <div>
              <paper-input class="red" id="delete-folder-name" label="Type folder name to delete"
                           pattern="[a-zA-Z0-9_-]*"
                           error-message="Allows letters, numbers and -_." auto-validate></paper-input>
              <br/>
              <wl-button class="blue button" type="submit" id="delete-button" outlined @click="${(e) => this._deleteFolderWithCheck(e)}">
                <wl-icon>close</wl-icon>
                Delete
              </wl-button>
            </div>
            </section>
        </wl-card>
      </wl-dialog>
      <wl-dialog id="info-folder-dialog" class="dialog-ask" fixed backdrop blockscrolling>
        <wl-card class="intro centered" style="margin: 0;">
          <h3 class="horizontal center layout" style="border-bottom:1px solid #ddd;">
            <span>${this.folderInfo.name}</span>
            <div class="flex"></div>
            <wl-button fab flat inverted @click="${(e) => this._hideDialog(e)}">
              <wl-icon>close</wl-icon>
            </wl-button>
          </h3>
          <div role="listbox" style="margin: 0;">
            <vaadin-item>
              <div><strong>ID</strong></div>
              <div secondary>${this.folderInfo.id}</div>
            </vaadin-item>
            <vaadin-item>
              <div><strong>Location</strong></div>
              <div secondary>${this.folderInfo.host}</div>
            </vaadin-item>
            <vaadin-item>
              <div><strong>Number of Files</strong></div>
              <div secondary>${this.folderInfo.numFiles}</div>
            </vaadin-item>
            ${this.folderInfo.is_owner ? html`
              <vaadin-item>
                <div><strong>Ownership</strong></div>
                <div secondary>You are the owner of this folder.</div>
              </vaadin-item>
            ` : html``}
            <vaadin-item>
              <div><strong>Permission</strong></div>
              <div secondary>${this.folderInfo.permission}</div>
            </vaadin-item>
          </div>
        </wl-card>
      </wl-dialog>
      <wl-dialog id="folder-explorer-dialog">
        <wl-card>
          <h3 class="horizontal center layout" style="font-weight:bold">
            <span>${this.explorer.id}</span>
            <div class="flex"></div>
            <wl-button fab flat inverted @click="${(e) => this._hideDialog(e)}">
              <wl-icon>close</wl-icon>
            </wl-button>
          </h3>

          <div class="breadcrumb">
          ${this.explorer.breadcrumb ? html`
              ${this.explorer.breadcrumb.map(item => html`
               <span>&gt;</span>
               <wl-button outlined class="goto" path="item" @click="${(e) => this._gotoFolder(e)}" dest="${item}">${item}</wl-button>
              `)}
              ` : html``}
          </div>
          <div>
            <wl-button outlined raised id="add-btn" @click="${(e) => this._uploadFileBtnClick(e)}">Upload Files...</wl-button>
            <wl-button outlined id="mkdir" @click="${(e) => this._mkdirDialog(e)}">New Directory</wl-button>
          </div>

          <div id="upload">
            <div id="dropzone"><p>drag</p></div>
            <input type="file" id="fileInput" on-change="_uploadFileChange" hidden multiple>
            ${this.uploadFiles.length ? html`
              <vaadin-grid class="progress" theme="row-stripes compact" aria-label="uploadFiles" .items="${this.uploadFiles}"
                           height-by-rows>
                <vaadin-grid-column width="100px" flex-grow="0">
                  <template>
                    <vaadin-item class="progress-item">
                      <div>
                        <template is="dom-if" if="[[item.complete]]">
                          <wl-icon>check</wl-icon>
                        </template>
                      </div>
                    </vaadin-item>
                  </template>
                </vaadin-grid-column>

                <vaadin-grid-column>
                  <template>
                    <vaadin-item>
                      <span>[[item.name]]</span>
                      <template is="dom-if" if="[[!item.complete]]">
                        <div>
                          <vaadin-progress-bar indeterminate value="0"></vaadin-progress-bar>
                        </div>
                      </template>
                    </vaadin-item>
                  </template>
                </vaadin-grid-column>
              </vaadin-grid>
            ` : html``}
          </div>

          <vaadin-grid class="explorer" theme="row-stripes compact" aria-label="Explorer" .items="${this.explorerFiles}">
            <vaadin-grid-column width="40px" flex-grow="0" resizable header="#" .renderer="${this._boundIndexRenderer}">
            </vaadin-grid-column>

            <vaadin-grid-sort-column flex-grow="2" resizable header="Name" path="filename">
              <template>
                <template is="dom-if" if="[[_isDir(item)]]">
                  <div class="indicator" on-click="_enqueueFolder" name="[[item.filename]]">
                    <paper-icon-button class="fg controls-running" icon="folder-open"
                                       name="[[item.filename]]"></paper-icon-button>
                    [[item.filename]]
                  </div>
                </template>

                <template is="dom-if" if="[[!_isDir(item)]]">
                  <div class="indicator">
                    <paper-icon-button class="fg controls-running" icon="insert-drive-file"></paper-icon-button>
                    [[item.filename]]
                  </div>
                </template>
              </template>
            </vaadin-grid-sort-column>

            <vaadin-grid-column flex-grow="2" resizable>
              <template class="header">
                <vaadin-grid-sorter path="ctime">Created</vaadin-grid-sorter>
              </template>
              <template>
                <div class="layout vertical">
                  <span>[[_humanReadableTime(item.ctime)]]</span>
                </div>
              </template>
            </vaadin-grid-column>

            <vaadin-grid-column flex-grow="1" resizable>
              <template class="header">
                <vaadin-grid-sorter path="size">Size</vaadin-grid-sorter>
              </template>
              <template>
                <div class="layout vertical">
                  <span>[[item.size]]</span>
                </div>
              </template>
            </vaadin-grid-column>
            <vaadin-grid-column resizable flex-grow="2" header="Actions" .renderer="${this._boundControlFileListRenderer}"></vaadin-grid-column>
          </vaadin-grid>
        </wl-card>
      </wl-dialog>

      <wl-dialog id="mkdir-dialog" class="dialog-ask" fixed blockscrolling backdrop>
        <wl-card elevation="1" class="login-panel intro centered" style="margin: 0;">
          <h3 class="horizontal center layout">
            <span>Create a new folder</span>
            <div class="flex"></div>
            <wl-button fab flat inverted @click="${(e) => this._hideDialog(e)}">
              <wl-icon>close</wl-icon>
            </wl-button>
          </h3>
          <section>
            <paper-input id="mkdir-name" label="Folder name" pattern="[a-zA-Z0-9_-]*"
                         error-message="Allows letters, numbers and -_." auto-validate></paper-input>
            <br/>
            <wl-button class="blue button" type="submit" id="mkdir-btn" @click="${(e) => this._mkdir(e)}" outlined>
              <wl-icon>rowing</wl-icon>
              Create
            </wl-button>
          </section>
        </wl-card>
      </wl-dialog>
    `;
  }

  indexRenderer(root, column, rowData) {
    render(
      html`${this._indexFrom1(rowData.index)}`, root
    );
  }

  controlFolderListRenderer(root, column, rowData) {
    render(
      html`
        <div id="controls" class="layout horizontal flex center"
             folder-id="${rowData.item.name}">
          <paper-icon-button class="fg green controls-running" icon="vaadin:info-circle-o"
                             @click="${(e) => this._infoFolder(e)}"></paper-icon-button>
          ${this._hasPermission(rowData.item, 'r') ? html`
            <paper-icon-button class="fg blue controls-running" icon="folder-open"
                               @click="${(e) => this._folderExplorer(e)}" .folder-id="${rowData.item.name}"></paper-icon-button>
                               ` : html``}
          ${this._hasPermission(rowData.item, 'w') ? html`` : html``}
          ${this._hasPermission(rowData.item, 'd') ? html`
              <paper-icon-button class="fg red controls-running" icon="delete"
                                 @click="${(e) => this._deleteFolderDialog(e)}"></paper-icon-button>
          ` : html``}
          </div>
       `, root
    );
  }

  controlFileListRenderer(root, column, rowData) {
    render(
      html`
        ${!this._isDir(rowData.item) && this._isDownloadable(rowData.item) ?
        html`
            <paper-icon-button id="download-btn" class="tiny fg red" icon="vaadin:download"
                               filename="${rowData.item.filename}" @click="${(e) => this._downloadFile(e)}"></paper-icon-button>
                               ` : html``}
       `, root
    );
  }

  permissionViewRenderer(root, column, rowData) {
    render(
      html`
        <div class="horizontal center-justified wrap layout">
        ${this._hasPermission(rowData.item, 'r') ? html`
            <lablup-shields app="" color="green"
                            description="R" ui="flat"></lablup-shields>` : html``}
        ${this._hasPermission(rowData.item, 'w') ? html`
            <lablup-shields app="" color="blue"
                            description="W" ui="flat"></lablup-shields>` : html``}
        ${this._hasPermission(rowData.item, 'd') ? html`
            <lablup-shields app="" color="red"
                            description="D" ui="flat"></lablup-shields>` : html``}
        </div>`, root
    )
  }

  firstUpdated() {
    this._addEventListenerDropZone();
    this._clearExplorer = this._clearExplorer.bind(this);
    this._mkdir = this._mkdir.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
  }

  shouldUpdate() {
    return this.active;
  }

  _refreshFolderList() {
    this.shadowRoot.querySelector('#loading-indicator').show();
    let l = window.backendaiclient.vfolder.list();
    l.then((value) => {
      this.shadowRoot.querySelector('#loading-indicator').hide();
      this.folders = value;
    });
    let vhosts = window.backendaiclient.vfolder.list_hosts();
    vhosts.then((response) => {
      console.log(response);
    });
  }

  async _menuChanged(active) {
    await this.updateComplete;
    if (active === false) {
      return;
    }
    if (window.backendaiclient === undefined || window.backendaiclient === null || window.backendaiclient.ready === false) {
      document.addEventListener('backend-ai-connected', () => {
        this.is_admin = window.backendaiclient.is_admin;
        this.authenticated = true;
        this._refreshFolderList();
      }, true);
    } else {
      this.is_admin = window.backendaiclient.is_admin;
      this.authenticated = true;
      this._refreshFolderList();
    }
  }

  _countObject(obj) {
    return Object.keys(obj).length;
  }

  async _addFolderDialog() {
    let vhost_info = await window.backendaiclient.vfolder.list_hosts();
    this.vhosts = vhost_info.allowed;
    this.vhost = vhost_info.default;
    this.openDialog('add-folder-dialog');
  }

  _folderExplorerDialog() {
    this.openDialog('folder-explorer-dialog');
  }

  _mkdirDialog() {
    this.shadowRoot.querySelector('#mkdir-name').value = '';
    this.openDialog('mkdir-dialog');
  }

  openDialog(id) {
    //var body = document.querySelector('body');
    //body.appendChild(this.$[id]);
    this.shadowRoot.querySelector('#' + id).show();
  }

  closeDialog(id) {
    this.shadowRoot.querySelector('#' + id).hide();
  }

  _indexFrom1(index) {
    return index + 1;
  }

  _hasPermission(item, perm) {
    if (item.permission.includes(perm)) {
      return true;
    }
    if (item.permission.includes('w') && perm === 'r') {
      return true;
    }
    return false;
  }

  _addFolder() {
    let name = this.shadowRoot.querySelector('#add-folder-name').value;
    let host = this.shadowRoot.querySelector('#add-folder-host').value;
    let job = window.backendaiclient.vfolder.create(name, host);
    job.then((value) => {
      this.shadowRoot.querySelector('#notification').text = 'Folder is successfully created.';
      this.shadowRoot.querySelector('#notification').show();
      this._refreshFolderList();
    }).catch(err => {
      console.log(err);
      if (err && err.message) {
        this.shadowRoot.querySelector('#notification').text = err.message;
        this.shadowRoot.querySelector('#notification').show();
      }
    });
    this.closeDialog('add-folder-dialog');
  }

  _getControlId(e) {
    const controller = e.target;
    const controls = controller.closest('#controls');
    const folderId = controls.getAttribute('folder-id');
    return folderId;
  }

  _infoFolder(e) {
    const folderId = this._getControlId(e);
    let job = window.backendaiclient.vfolder.info(folderId);
    job.then((value) => {
      this.folderInfo = value;
      this.openDialog('info-folder-dialog');
    }).catch(err => {
      console.log(err);
      if (err && err.message) {
        this.shadowRoot.querySelector('#notification').text = err.message;
        this.shadowRoot.querySelector('#notification').show();
      }
    });
  }

  _deleteFolderDialog(e) {
    this.deleteFolderId = this._getControlId(e);
    this.shadowRoot.querySelector('#delete-folder-name').value = '';
    this.openDialog('delete-folder-dialog');
  }

  _deleteFolderWithCheck() {
    let typedDeleteFolderName = this.shadowRoot.querySelector('#delete-folder-name').value;
    if (typedDeleteFolderName != this.deleteFolderId) {
      this.shadowRoot.querySelector('#notification').text = 'Folder name mismatched. Check your typing.';
      this.shadowRoot.querySelector('#notification').show();
      return;
    }
    this.closeDialog('delete-folder-dialog');
    this._deleteFolder(this.deleteFolderId);
  }

  _deleteFolder(folderId) {
    let job = window.backendaiclient.vfolder.delete(folderId);
    job.then((value) => {
      this.shadowRoot.querySelector('#notification').text = 'Folder is successfully deleted.';
      this.shadowRoot.querySelector('#notification').show();
      this._refreshFolderList();
    }).catch(err => {
      console.log(err);
      if (err && err.message) {
        this.shadowRoot.querySelector('#notification').text = err.message;
        this.shadowRoot.querySelector('#notification').show();
      }
    });
  }

  /*Folder Explorer*/
  _clearExplorer(path = this.explorer.breadcrumb.join('/'),
                 id = this.explorer.id,
                 dialog = false) {
    let job = window.backendaiclient.vfolder.list_files(path, id);
    job.then(value => {
      this.explorer.files = JSON.parse(value.files);
      this.explorerFiles = this.explorer.files;
      if (dialog) {
        this.openDialog('folder-explorer-dialog');
      }
    });
  }

  _folderExplorer(e) {
    let folderId = this._getControlId(e);
    let explorer = {
      id: folderId,
      breadcrumb: ['.'],
    };

    this.explorer = explorer;
    this._clearExplorer(explorer.breadcrumb.join('/'), explorer.id, true);
  }

  _enqueueFolder(e) {
    const fn = e.target.name;
    this.push('explorer.breadcrumb', fn);
    this._clearExplorer();
  }

  _gotoFolder(e) {
    const dest = e.target.dest;
    let tempBreadcrumb = this.explorer.breadcrumb;
    const index = tempBreadcrumb.indexOf(dest);

    if (index === -1) {
      return;
    }

    tempBreadcrumb = tempBreadcrumb.slice(0, index + 1);

    this.explorer.breadcrumb = tempBreadcrumb;
    this._clearExplorer(tempBreadcrumb.join('/'), this.explorer.id, false);
  }

  _mkdir(e) {
    const newfolder = this.shadowRoot.querySelector('#mkdir-name').value;
    const explorer = this.explorer;
    let job = window.backendaiclient.vfolder.mkdir([...explorer.breadcrumb, newfolder].join('/'), explorer.id);
    job.then(res => {
      this.closeDialog('mkdir-dialog');
      this._clearExplorer();
    });
  }

  _isDir(file) {
    return file.mode.startsWith("d");
  }

  /* File upload and download */
  _addEventListenerDropZone() {
    const dndZoneEl = this.shadowRoot.querySelector('#folder-explorer-dialog');
    const dndZonePlaceholderEl = this.shadowRoot.querySelector('#dropzone');

    dndZonePlaceholderEl.addEventListener('dragleave', () => {
      dndZonePlaceholderEl.style.display = "none";
    });

    dndZoneEl.addEventListener('dragover', e => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      dndZonePlaceholderEl.style.display = "flex";
      return false;
    });

    dndZoneEl.addEventListener('drop', e => {
      e.stopPropagation();
      e.preventDefault();
      dndZonePlaceholderEl.style.display = "none";

      let temp = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.size > 2 ** 20) {
          console.log('File size limit (< 1 MiB)');
        } else {
          file.progress = 0;
          file.error = false;
          file.complete = false;
          temp.push(file);
          this.push("uploadFiles", file);
        }
      }

      for (let i = 0; i < temp.length; i++) {
        this.fileUpload(temp[i]);
        this._clearExplorer();
      }
    });
  }

  _uploadFileBtnClick(e) {
    const elem = this.shadowRoot.querySelector('#fileInput');
    if (elem && document.createEvent) {  // sanity check
      const evt = document.createEvent("MouseEvents");
      evt.initEvent("click", true, false);
      elem.dispatchEvent(evt);
    }
  }

  _uploadFileChange(e) {
    const length = e.target.files.length;
    for (let i = 0; i < length; i++) {
      const file = e.target.files[i];

      let text = "";
      let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < 5; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

      file.id = text;
      file.progress = 0;
      file.error = false;
      file.complete = false;
      this.push("uploadFiles", file);
    }

    for (let i = 0; i < length; i++) {
      this.fileUpload(this.uploadFiles[i]);
      this._clearExplorer();
    }

    this.shadowRoot.querySelector('#fileInput').value = '';
  }

  fileUpload(fileObj) {
    const fd = new FormData();
    const explorer = this.explorer;
    const path = explorer.breadcrumb.concat(fileObj.name).join("/");
    fd.append("src", fileObj, path);
    const index = this.uploadFiles.indexOf(fileObj);

    let job = window.backendaiclient.vfolder.uploadFormData(fd, explorer.id);
    job.then(resp => {
      this._clearExplorer();
      this.uploadFiles[index].complete = true;

      setTimeout(() => {
        this.splice('uploadFiles', this.uploadFiles.indexOf(fileObj), 1);
      }, 1000);
    });
  }

  _downloadFile(e) {
    let fn = e.target.filename;
    let path = this.explorer.breadcrumb.concat(fn).join("/");
    let job = window.backendaiclient.vfolder.download(path, this.explorer.id);
    job.then(res => {
      const url = window.URL.createObjectURL(res);
      let a = document.createElement('a');
      a.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      a.href = url;
      a.download = fn;
      document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
      a.click();
      a.remove();  //afterwards we remove the element again
      URL.revokeObjectURL(url);
    });
  }

  _humanReadableTime(d) {
    const date = new Date(d * 1000);
    const offset = date.getTimezoneOffset() / 60;
    const hours = date.getHours();
    date.setHours(hours - offset);
    return date.toUTCString();
  }

  _isDownloadable(file) {
    return file.size < 209715200
  }

  _hideDialog(e) {
    let hideButton = e.target;
    let dialog = hideButton.closest('wl-dialog');
    dialog.hide();
  }
}

customElements.define('backend-ai-data-view', BackendAIData);