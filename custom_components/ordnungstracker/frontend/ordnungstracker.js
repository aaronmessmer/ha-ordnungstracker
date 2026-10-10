/* Ordnungs-Tracker 0.5.0 – gebautes Bündel, Quelltext: frontend/ */
var X=globalThis,ee=X.ShadowRoot&&(X.ShadyCSS===void 0||X.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ae=Symbol(),Ge=new WeakMap,K=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==ae)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(ee&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=Ge.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&Ge.set(e,t))}return t}toString(){return this.cssText}},Ze=a=>new K(typeof a=="string"?a:a+"",void 0,ae),v=(a,...t)=>{let e=a.length===1?a[0]:t.reduce((i,s,n)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+a[n+1],a[0]);return new K(e,a,ae)},Qe=(a,t)=>{if(ee)a.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let i=document.createElement("style"),s=X.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,a.appendChild(i)}},oe=ee?a=>a:a=>a instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return Ze(e)})(a):a;var{is:kt,defineProperty:Et,getOwnPropertyDescriptor:Tt,getOwnPropertyNames:St,getOwnPropertySymbols:At,getPrototypeOf:Ct}=Object,te=globalThis,Ye=te.trustedTypes,Lt=Ye?Ye.emptyScript:"",Nt=te.reactiveElementPolyfillSupport,F=(a,t)=>a,le={toAttribute(a,t){switch(t){case Boolean:a=a?Lt:null;break;case Object:case Array:a=a==null?a:JSON.stringify(a)}return a},fromAttribute(a,t){let e=a;switch(t){case Boolean:e=a!==null;break;case Number:e=a===null?null:Number(a);break;case Object:case Array:try{e=JSON.parse(a)}catch{e=null}}return e}},Xe=(a,t)=>!kt(a,t),Je={attribute:!0,type:String,converter:le,reflect:!1,useDefault:!1,hasChanged:Xe};Symbol.metadata??=Symbol("metadata"),te.litPropertyMetadata??=new WeakMap;var T=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Je){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let i=Symbol(),s=this.getPropertyDescriptor(t,i,e);s!==void 0&&Et(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){let{get:s,set:n}=Tt(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:s,set(o){let d=s?.call(this);n?.call(this,o),this.requestUpdate(t,d,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Je}static _$Ei(){if(this.hasOwnProperty(F("elementProperties")))return;let t=Ct(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(F("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(F("properties"))){let e=this.properties,i=[...St(e),...At(e)];for(let s of i)this.createProperty(s,e[s])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[i,s]of e)this.elementProperties.set(i,s)}this._$Eh=new Map;for(let[e,i]of this.elementProperties){let s=this._$Eu(e,i);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let s of i)e.unshift(oe(s))}else t!==void 0&&e.push(oe(t));return e}static _$Eu(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Qe(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){let i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:le).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){let i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){let n=i.getPropertyOptions(s),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:le;this._$Em=s;let d=o.fromAttribute(e,n.type);this[s]=d??this._$Ej?.get(s)??d,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(t!==void 0){let o=this.constructor;if(s===!1&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??Xe)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),n!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[s,n]of i){let{wrapped:o}=n,d=this[s];o!==!0||this._$AL.has(s)||d===void 0||this.C(s,void 0,n,d)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(e)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};T.elementStyles=[],T.shadowRootOptions={mode:"open"},T[F("elementProperties")]=new Map,T[F("finalized")]=new Map,Nt?.({ReactiveElement:T}),(te.reactiveElementVersions??=[]).push("2.1.2");var ge=globalThis,et=a=>a,ie=ge.trustedTypes,tt=ie?ie.createPolicy("lit-html",{createHTML:a=>a}):void 0,ot="$lit$",L=`lit$${Math.random().toFixed(9).slice(2)}$`,lt="?"+L,Pt=`<${lt}>`,R=document,W=()=>R.createComment(""),V=a=>a===null||typeof a!="object"&&typeof a!="function",ve=Array.isArray,Rt=a=>ve(a)||typeof a?.[Symbol.iterator]=="function",ce=`[ 	
\f\r]`,j=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,it=/-->/g,st=/>/g,N=RegExp(`>|${ce}(?:([^\\s"'>=/]+)(${ce}*=${ce}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),nt=/'/g,rt=/"/g,ct=/^(?:script|style|textarea|title)$/i,fe=a=>(t,...e)=>({_$litType$:a,strings:t,values:e}),r=fe(1),oi=fe(2),li=fe(3),D=Symbol.for("lit-noChange"),l=Symbol.for("lit-nothing"),at=new WeakMap,P=R.createTreeWalker(R,129);function dt(a,t){if(!ve(a)||!a.hasOwnProperty("raw"))throw Error("invalid template strings array");return tt!==void 0?tt.createHTML(t):t}var Dt=(a,t)=>{let e=a.length-1,i=[],s,n=t===2?"<svg>":t===3?"<math>":"",o=j;for(let d=0;d<e;d++){let c=a[d],g,m,f=-1,E=0;for(;E<c.length&&(o.lastIndex=E,m=o.exec(c),m!==null);)E=o.lastIndex,o===j?m[1]==="!--"?o=it:m[1]!==void 0?o=st:m[2]!==void 0?(ct.test(m[2])&&(s=RegExp("</"+m[2],"g")),o=N):m[3]!==void 0&&(o=N):o===N?m[0]===">"?(o=s??j,f=-1):m[1]===void 0?f=-2:(f=o.lastIndex-m[2].length,g=m[1],o=m[3]===void 0?N:m[3]==='"'?rt:nt):o===rt||o===nt?o=N:o===it||o===st?o=j:(o=N,s=void 0);let C=o===N&&a[d+1].startsWith("/>")?" ":"";n+=o===j?c+Pt:f>=0?(i.push(g),c.slice(0,f)+ot+c.slice(f)+L+C):c+L+(f===-2?d:C)}return[dt(a,n+(a[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]},G=class a{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0,d=t.length-1,c=this.parts,[g,m]=Dt(t,e);if(this.el=a.createElement(g,i),P.currentNode=this.el.content,e===2||e===3){let f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(s=P.nextNode())!==null&&c.length<d;){if(s.nodeType===1){if(s.hasAttributes())for(let f of s.getAttributeNames())if(f.endsWith(ot)){let E=m[o++],C=s.getAttribute(f).split(L),J=/([.?@])?(.*)/.exec(E);c.push({type:1,index:n,name:J[2],strings:C,ctor:J[1]==="."?he:J[1]==="?"?ue:J[1]==="@"?pe:H}),s.removeAttribute(f)}else f.startsWith(L)&&(c.push({type:6,index:n}),s.removeAttribute(f));if(ct.test(s.tagName)){let f=s.textContent.split(L),E=f.length-1;if(E>0){s.textContent=ie?ie.emptyScript:"";for(let C=0;C<E;C++)s.append(f[C],W()),P.nextNode(),c.push({type:2,index:++n});s.append(f[E],W())}}}else if(s.nodeType===8)if(s.data===lt)c.push({type:2,index:n});else{let f=-1;for(;(f=s.data.indexOf(L,f+1))!==-1;)c.push({type:7,index:n}),f+=L.length-1}n++}}static createElement(t,e){let i=R.createElement("template");return i.innerHTML=t,i}};function q(a,t,e=a,i){if(t===D)return t;let s=i!==void 0?e._$Co?.[i]:e._$Cl,n=V(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(a),s._$AT(a,e,i)),i!==void 0?(e._$Co??=[])[i]=s:e._$Cl=s),s!==void 0&&(t=q(a,s._$AS(a,t.values),s,i)),t}var de=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??R).importNode(e,!0);P.currentNode=s;let n=P.nextNode(),o=0,d=0,c=i[0];for(;c!==void 0;){if(o===c.index){let g;c.type===2?g=new Z(n,n.nextSibling,this,t):c.type===1?g=new c.ctor(n,c.name,c.strings,this,t):c.type===6&&(g=new me(n,this,t)),this._$AV.push(g),c=i[++d]}o!==c?.index&&(n=P.nextNode(),o++)}return P.currentNode=R,s}p(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},Z=class a{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=l,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=q(this,t,e),V(t)?t===l||t==null||t===""?(this._$AH!==l&&this._$AR(),this._$AH=l):t!==this._$AH&&t!==D&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Rt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==l&&V(this._$AH)?this._$AA.nextSibling.data=t:this.T(R.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=G.createElement(dt(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{let n=new de(s,this),o=n.u(this.options);n.p(e),this.T(o),this._$AH=n}}_$AC(t){let e=at.get(t.strings);return e===void 0&&at.set(t.strings,e=new G(t)),e}k(t){ve(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,s=0;for(let n of t)s===e.length?e.push(i=new a(this.O(W()),this.O(W()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let i=et(t).nextSibling;et(t).remove(),t=i}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},H=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=l,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=l}_$AI(t,e=this,i,s){let n=this.strings,o=!1;if(n===void 0)t=q(this,t,e,0),o=!V(t)||t!==this._$AH&&t!==D,o&&(this._$AH=t);else{let d=t,c,g;for(t=n[0],c=0;c<n.length-1;c++)g=q(this,d[i+c],e,c),g===D&&(g=this._$AH[c]),o||=!V(g)||g!==this._$AH[c],g===l?t=l:t!==l&&(t+=(g??"")+n[c+1]),this._$AH[c]=g}o&&!s&&this.j(t)}j(t){t===l?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},he=class extends H{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===l?void 0:t}},ue=class extends H{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==l)}},pe=class extends H{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=q(this,t,e,0)??l)===D)return;let i=this._$AH,s=t===l&&i!==l||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==l&&(i===l||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},me=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){q(this,t)}};var Mt=ge.litHtmlPolyfillSupport;Mt?.(G,Z),(ge.litHtmlVersions??=[]).push("3.3.3");var ht=(a,t,e)=>{let i=e?.renderBefore??t,s=i._$litPart$;if(s===void 0){let n=e?.renderBefore??null;i._$litPart$=s=new Z(t.insertBefore(W(),n),n,void 0,e??{})}return s._$AI(a),s};var be=globalThis,u=class extends T{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ht(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return D}};u._$litElement$=!0,u.finalized=!0,be.litElementHydrateSupport?.({LitElement:u});var qt=be.litElementPolyfillSupport;qt?.({LitElement:u});(be.litElementVersions??=[]).push("4.2.2");var p=v`
  :host {
    --ot-radius: var(--ha-card-border-radius, 12px);
    --ot-gap: 12px;
    --ot-touch: 48px;
    font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif));
    color: var(--primary-text-color);
    box-sizing: border-box;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  h1,
  h2,
  h3 {
    margin: 0;
    font-weight: 500;
  }
  h2 {
    font-size: 1.1rem;
  }
  h3 {
    font-size: 1rem;
    color: var(--secondary-text-color);
  }
  a {
    color: var(--primary-color);
  }
  .muted {
    color: var(--secondary-text-color);
  }
  .small {
    font-size: 0.85rem;
  }
  .grow {
    flex: 1;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wrap {
    flex-wrap: wrap;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--ot-gap);
  }
  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Knöpfe */
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 20px;
    border: 1px solid var(--divider-color);
    background: transparent;
    font-weight: 500;
  }
  .btn.primary {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .btn.danger {
    color: var(--error-color);
    border-color: var(--error-color);
  }
  .btn.text {
    border-color: transparent;
  }
  .btn[disabled] {
    opacity: 0.5;
    cursor: default;
  }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ot-touch);
    height: var(--ot-touch);
    border: none;
    border-radius: 50%;
    background: transparent;
    flex: none;
  }
  .icon-btn:hover,
  .btn:hover {
    background-color: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  .btn.primary:hover {
    background: var(--primary-color);
    filter: brightness(1.1);
  }

  /* Eingabefelder */
  label.field {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--secondary-text-color);
  }
  input,
  select,
  textarea {
    font: inherit;
    color: var(--primary-text-color);
    background: var(--card-background-color, transparent);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 10px 12px;
    min-height: 44px;
    width: 100%;
  }
  textarea {
    resize: vertical;
  }
  input[type="checkbox"] {
    width: 22px;
    height: 22px;
    min-height: 0;
    padding: 0;
  }
  label.check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    color: var(--primary-text-color);
    font-size: 1rem;
  }

  /* Karten, Listen */
  .card {
    background: var(--card-background-color, #fff);
    border-radius: var(--ot-radius);
    border: 1px solid var(--divider-color);
    padding: 16px;
  }
  .list {
    display: flex;
    flex-direction: column;
    background: var(--card-background-color, #fff);
    border-radius: var(--ot-radius);
    border: 1px solid var(--divider-color);
    overflow: hidden;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 12px;
    border: none;
    border-bottom: 1px solid var(--divider-color);
    background: transparent;
    text-align: left;
    width: 100%;
    content-visibility: auto;
    contain-intrinsic-size: auto 60px;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .item:last-child {
    border-bottom: none;
  }
  .item:hover {
    background-color: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
  }
  .item.selected {
    background-color: color-mix(in srgb, var(--primary-color) 18%, transparent);
  }
  .item .icon {
    color: var(--secondary-text-color);
    flex: none;
  }
  .item .title {
    font-size: 1rem;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.2em;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    font-weight: 600;
    font-size: 0.85rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    min-height: 26px;
    border-radius: 13px;
    font-size: 0.8rem;
    border: 1px solid var(--divider-color);
    background: transparent;
    color: var(--secondary-text-color);
  }
  .chip.warning {
    border-color: var(--warning-color, #ff9800);
    color: var(--warning-color, #ff9800);
  }
  .chip.error {
    border-color: var(--error-color, #db4437);
    color: var(--error-color, #db4437);
  }
  button.chip {
    cursor: pointer;
    min-height: 36px;
    padding: 0 14px;
    font-size: 0.9rem;
  }
  button.chip[aria-pressed="true"] {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  .empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--secondary-text-color);
  }
  .empty ha-icon {
    --mdc-icon-size: 48px;
    opacity: 0.6;
  }
  .section-title {
    margin: 20px 4px 8px;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }
  .error-text {
    color: var(--error-color);
  }
`;var _e=class extends u{constructor(){super();this._previous=null;this._keydown=e=>{if(e.key==="Escape")e.stopPropagation(),this._close();else if(e.key==="Tab"){let i=[...this.renderRoot.querySelectorAll("button, [href]"),...this.querySelectorAll("button, [href], input, select, textarea, summary")].filter(d=>!d.hasAttribute("disabled"));if(i.length===0)return;let s=i[0],n=i[i.length-1],o=this.getRootNode().activeElement;e.shiftKey&&(o===s||o===this)?(e.preventDefault(),n.focus()):!e.shiftKey&&o===n&&(e.preventDefault(),s.focus())}};this.heading="",this.closeLabel="Schlie\xDFen",this.wide=!1}static{this.properties={heading:{type:String},closeLabel:{type:String},wide:{type:Boolean}}}static{this.styles=[p,v`
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .dialog {
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        border-radius: var(--ot-radius);
        width: min(560px, 100vw - 32px);
        max-height: calc(100dvh - 32px);
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      }
      .dialog.wide {
        width: min(760px, 100vw - 32px);
      }
      header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 8px 8px 20px;
        border-bottom: 1px solid var(--divider-color);
      }
      header h2 {
        flex: 1;
        font-size: 1.2rem;
      }
      .body {
        padding: 16px 20px;
        overflow-y: auto;
        flex: 1;
      }
      footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 20px;
        border-top: 1px solid var(--divider-color);
      }
      footer:not(:has(*)) {
        display: none;
      }
      @media (max-width: 600px) {
        .backdrop {
          align-items: flex-end;
        }
        .dialog,
        .dialog.wide {
          width: 100vw;
          max-height: 94dvh;
          border-radius: var(--ot-radius) var(--ot-radius) 0 0;
        }
      }
    `]}connectedCallback(){super.connectedCallback(),this._previous=document.activeElement,this.addEventListener("keydown",this._keydown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._keydown),this._previous?.focus?.()}firstUpdated(){(this.querySelector("input, textarea, select")??this.renderRoot.querySelector(".dialog"))?.focus()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}render(){return r`
      <div class="backdrop" @click=${e=>e.target===e.currentTarget&&this._close()}>
        <div class="dialog ${this.wide?"wide":""}" role="dialog" aria-modal="true" aria-label=${this.heading} tabindex="-1">
          <header>
            <h2>${this.heading}</h2>
            <button class="icon-btn" aria-label=${this.closeLabel} @click=${this._close}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </header>
          <div class="body"><slot></slot></div>
          <footer><slot name="footer"></slot></footer>
        </div>
      </div>
    `}};customElements.define("ot-dialog",_e);var ye=class extends u{static{this.properties={heading:{type:String},message:{type:String},confirmLabel:{type:String},cancelLabel:{type:String},danger:{type:Boolean}}}constructor(){super(),this.heading="",this.message="",this.confirmLabel="OK",this.cancelLabel="Abbrechen",this.danger=!1}static{this.styles=[p,v`p { margin: 0; white-space: pre-line; line-height: 1.5; }`]}_fire(t){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0}))}render(){return r`
      <ot-dialog .heading=${this.heading} @close=${()=>this._fire("cancel")}>
        <p>${this.message}</p>
        <button slot="footer" class="btn text" @click=${()=>this._fire("cancel")}>${this.cancelLabel}</button>
        <button slot="footer" class="btn ${this.danger?"danger":"primary"}" @click=${()=>this._fire("confirm")}>${this.confirmLabel}</button>
      </ot-dialog>
    `}};customElements.define("ot-confirm",ye);var $e=class extends u{static{this.properties={path:{attribute:!1},rootLabel:{type:String},current:{type:Boolean}}}constructor(){super(),this.path=[],this.rootLabel="Start",this.current=!1}static{this.styles=[p,v`
      nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0;
        font-size: 0.9rem;
      }
      button {
        border: none;
        background: transparent;
        padding: 6px 4px;
        min-height: 36px;
        color: var(--primary-color);
        border-radius: 6px;
      }
      button:hover {
        text-decoration: underline;
      }
      .sep {
        color: var(--secondary-text-color);
        --mdc-icon-size: 18px;
      }
      .here {
        padding: 6px 4px;
        color: var(--secondary-text-color);
      }
    `]}_go(t){this.dispatchEvent(new CustomEvent("open-node",{detail:t,bubbles:!0,composed:!0}))}render(){let t=this.current?this.path.slice(0,-1):this.path;return r`
      <nav aria-label="Pfad">
        <button @click=${()=>this._go(null)}>${this.rootLabel}</button>
        ${t.map(e=>r`
            <ha-icon class="sep" icon="mdi:chevron-right"></ha-icon>
            <button @click=${()=>this._go(e.id)}>${e.name}</button>
          `)}
        ${this.current&&this.path.length?r`<ha-icon class="sep" icon="mdi:chevron-right"></ha-icon><span class="here" aria-current="page">${this.path[this.path.length-1].name}</span>`:""}
      </nav>
    `}};customElements.define("ot-path",$e);var Ht={place:"mdi:door",furniture:"mdi:bookshelf",container:"mdi:package-variant",group:"mdi:shape",item:"mdi:circle-small"};function y(a){return a.icon||Ht[a.class]}function I(a){if(a.quantity===null||a.quantity===void 0)return"";let t=Number.isInteger(a.quantity)?String(a.quantity):String(Math.round(a.quantity*100)/100);return a.unit?`${t} ${a.unit}`:`${t}\xD7`}function Q(){let a=new Date,t=e=>String(e).padStart(2,"0");return`${a.getFullYear()}-${t(a.getMonth()+1)}-${t(a.getDate())}`}function ut(a,t){let e=new Date(`${a}T12:00:00`).getTime(),i=new Date(`${t}T12:00:00`).getTime();return Math.round((i-e)/864e5)}function se(a){switch(a.code){case"missing":case"expired":case"defective":return"error";case"below_min":case"expiring":return"warning";default:return"info"}}function k(a,t=!0){return(t?a:a.slice(0,-1)).map(i=>i.name).join(" \u203A ")}function $(a,t){if(!a)return"";let e=new Date(a.length===10?`${a}T12:00:00`:a);return Number.isNaN(e.getTime())?a:new Intl.DateTimeFormat(t,{dateStyle:"medium"}).format(e)}function pt(a,t,e,i){let s=a.value;return s==null||s===""?"":a.type==="bool"?s?e:i:a.type==="date"?$(String(s),t):a.type==="number"&&a.unit?`${s} ${a.unit}`:String(s)}function Y(a){let t=a.trim().replace(",",".");if(t==="")return null;let e=Number(t);return Number.isFinite(e)?e:void 0}function S(a){return a.split(/[,\n]/).map(t=>t.trim()).filter(Boolean)}function A(a){let t=/^\s*#?\s*(\d+)\s*$/.exec(a);return t?Number.parseInt(t[1],10):null}function mt(a,t,e){let i=new Blob([t],{type:`${e};charset=utf-8`}),s=URL.createObjectURL(i),n=document.createElement("a");n.href=s,n.download=a,document.body.appendChild(n),n.click(),n.remove(),setTimeout(()=>URL.revokeObjectURL(s),1e4)}function h(a){return a instanceof Error?a.message:String(a)}var xe=class extends u{static{this.properties={ctx:{attribute:!1},nodeId:{type:String},itemName:{type:String},quantity:{type:Number},unit:{type:String},_busy:{state:!0}}}constructor(){super(),this.nodeId="",this.itemName="",this.quantity=null,this.unit="",this._busy=!1}static{this.styles=[p,v`
      :host {
        display: inline-flex;
        flex: none;
        margin-right: 8px;
      }
      .stepper {
        display: inline-flex;
        align-items: center;
        gap: 2px;
      }
      .stepper button {
        width: 40px;
        height: 40px;
        min-height: 40px;
        border-radius: 50%;
        border: 1px solid var(--divider-color);
        background: transparent;
        color: var(--primary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .stepper button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
      .stepper button[disabled] {
        opacity: 0.4;
      }
      .value {
        min-width: 3.4em;
        font-size: 0.95rem;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }
    `]}async _step(t){if(!this._busy){this._busy=!0;try{let e=await this.ctx.api.quantityStep(this.nodeId,t);this.quantity=e.quantity,this.dispatchEvent(new CustomEvent("quantity-changed",{detail:e,bubbles:!0,composed:!0}))}catch(e){this.ctx.toast(h(e),"error")}finally{this._busy=!1}}}render(){if(this.quantity===null||this.quantity===void 0)return l;let t=this.ctx.t,e=this.itemName||"";return r`<span class="stepper" role="group" aria-label=${t("quantity.group",{name:e})}>
      <button type="button" aria-label=${t("quantity.less",{name:e})} ?disabled=${this._busy||this.quantity<=0} @click=${()=>this._step(-1)}><ha-icon icon="mdi:minus"></ha-icon></button>
      <span class="value" aria-live="polite">${I({quantity:this.quantity,unit:this.unit})}</span>
      <button type="button" aria-label=${t("quantity.more",{name:e})} ?disabled=${this._busy} @click=${()=>this._step(1)}><ha-icon icon="mdi:plus"></ha-icon></button>
    </span>`}};customElements.define("ot-stepper",xe);var It=450,Ot=10,we=100,ke=class extends u{constructor(){super();this.texts={selected:"ausgew\xE4hlt",items:"Eintr\xE4ge"};this._origin=null;this._suppressClick=!1;this.rows=[],this.selection=null,this.selectable=!1,this.showCounts=!0,this.label="",this._limit=we}static{this.properties={ctx:{attribute:!1},rows:{attribute:!1},selection:{attribute:!1},selectable:{type:Boolean},showCounts:{type:Boolean},label:{type:String},_limit:{state:!0}}}static{this.styles=[p,v`
      :host {
        display: block;
      }
      .sentinel {
        height: 1px;
      }
      .counts {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .chips {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 4px;
      }
      .check {
        color: var(--primary-color);
      }
      .rowbox {
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--divider-color);
        content-visibility: auto;
        contain-intrinsic-size: auto 60px;
      }
      .rowbox:last-child {
        border-bottom: none;
      }
      .rowbox .item {
        border-bottom: none;
        flex: 1;
        min-width: 0;
        width: auto;
        content-visibility: visible;
      }

    `]}willUpdate(e){e.has("rows")&&(this._limit=we)}updated(){this._observer?.disconnect();let e=this.renderRoot.querySelector(".sentinel");e&&typeof IntersectionObserver<"u"&&(this._observer=new IntersectionObserver(i=>{i.some(s=>s.isIntersecting)&&(this._limit+=we)}),this._observer.observe(e))}disconnectedCallback(){super.disconnectedCallback(),this._observer?.disconnect(),clearTimeout(this._timer)}_fire(e,i){this.dispatchEvent(new CustomEvent(e,{detail:i,bubbles:!0,composed:!0}))}_down(e,i){!this.selectable||e.button!==0||(this._origin={x:e.clientX,y:e.clientY},clearTimeout(this._timer),this._timer=setTimeout(()=>{this._suppressClick=!0,this.selection?.start(i),this._changed()},It))}_move(e){this._origin&&Math.hypot(e.clientX-this._origin.x,e.clientY-this._origin.y)>Ot&&this._cancel()}_cancel(){clearTimeout(this._timer),this._origin=null}_click(e){if(this._cancel(),this._suppressClick){this._suppressClick=!1;return}this.selectable&&this.selection?.active?(this.selection.toggle(e),this._changed()):this._fire("open-node",e)}_context(e,i){this.selectable&&(e.preventDefault(),this._cancel(),this.selection?.has(i)||this.selection?.start(i),this._changed())}_key(e,i){e.key!==" "||!this.selectable||!this.selection||(e.preventDefault(),this.selection.active?this.selection.toggle(i):this.selection.start(i),this._changed())}_changed(){this.requestUpdate(),this.dispatchEvent(new CustomEvent("selection-changed",{bubbles:!0,composed:!0}))}render(){let e=this.rows.slice(0,this._limit);return r`
      <div class="list" role="list" aria-label=${this.label}>
        ${e.map(i=>this._row(i))}
        ${this.rows.length>this._limit?r`<div class="sentinel"></div>`:l}
      </div>
    `}_row(e){let i=this.selection?.has(e.id)??!1,s=this.selection?.active??!1,n=e.stepper&&this.ctx&&!s?e.stepper:null;return r`
      <div class="rowbox" role="listitem">
      <button
        class="item ${i?"selected":""}"
        aria-label=${`${e.number!==null?`${e.number} `:""}${e.name}${i?`, ${this.texts.selected}`:""}`}
        @pointerdown=${o=>this._down(o,e.id)}
        @pointermove=${this._move}
        @pointerup=${this._cancel}
        @pointercancel=${this._cancel}
        @pointerleave=${this._cancel}
        @click=${()=>this._click(e.id)}
        @contextmenu=${o=>this._context(o,e.id)}
        @keydown=${o=>this._key(o,e.id)}
      >
        ${s?r`<ha-icon class="icon check" icon=${i?"mdi:checkbox-marked-circle":"mdi:checkbox-blank-circle-outline"}></ha-icon>`:r`<ha-icon class="icon" icon=${e.icon}></ha-icon>`}
        <span class="grow">
          <span class="row">
            ${e.number!==null?r`<span class="badge">${e.number}</span>`:l}
            <span class="title ellipsis ${e.archived?"muted":""}">${e.name}</span>
          </span>
          ${e.subtitle?r`<span class="small muted ellipsis" style="display:block">${e.subtitle}</span>`:l}
          ${e.hints.length?r`<span class="chips">${e.hints.slice(0,2).map(o=>r`<span class="chip ${se(o)}">${o.text}</span>`)}</span>`:l}
        </span>
        ${this.showCounts&&e.counts?r`<span class="counts" title=${`${e.counts[0]} / ${e.counts[1]}`}>${e.counts[0]}${e.counts[1]!==e.counts[0]?` \xB7 ${e.counts[1]}`:""}</span>`:l}
        ${s||n?l:r`<ha-icon class="icon" icon="mdi:chevron-right"></ha-icon>`}
      </button>
      ${n?r`<ot-stepper .ctx=${this.ctx} .nodeId=${e.id} .itemName=${e.name} .quantity=${n.quantity} .unit=${n.unit}></ot-stepper>`:l}
      </div>
    `}};customElements.define("ot-node-list",ke);var Ee=class extends u{static{this.properties={ctx:{attribute:!1},field:{attribute:!1},value:{attribute:!1},dim:{type:Boolean}}}constructor(){super(),this.dim=!1}static{this.styles=[p]}_emit(t){this.dispatchEvent(new CustomEvent("value-changed",{detail:{id:this.field.id,value:t},bubbles:!0,composed:!0}))}render(){let t=this.field,e=this.ctx.t,i=t.unit?`${t.name} (${t.unit})`:t.name,s=this.value===null||this.value===void 0?"":String(this.value),n;switch(t.type){case"multiline":n=r`<textarea rows="3" .value=${s} @input=${o=>this._emit(o.target.value||null)}></textarea>`;break;case"number":n=r`<input inputmode="decimal" .value=${s} @input=${o=>{let d=o.target.value,c=Y(d);this._emit(c===void 0?d:c)}} />`;break;case"date":n=r`<input type="date" .value=${s} @input=${o=>this._emit(o.target.value||null)} />`;break;case"link":n=r`<input type="url" inputmode="url" autocapitalize="off" .value=${s} @input=${o=>this._emit(o.target.value.trim()||null)} />`;break;case"bool":n=r`<select .value=${this.value===!0?"yes":this.value===!1?"no":""} @change=${o=>{let d=o.target.value;this._emit(d==="yes"?!0:d==="no"?!1:null)}}>
          <option value="" ?selected=${this.value===null||this.value===void 0}>–</option>
          <option value="yes" ?selected=${this.value===!0}>${e("common.yes")}</option>
          <option value="no" ?selected=${this.value===!1}>${e("common.no")}</option>
        </select>`;break;case"choice":n=r`<select .value=${s} @change=${o=>this._emit(o.target.value||null)}>
          <option value="" ?selected=${s===""}>–</option>
          ${(t.options??[]).map(o=>r`<option value=${o} ?selected=${o===s}>${o}</option>`)}
        </select>`;break;default:n=r`<input .value=${s} @input=${o=>this._emit(o.target.value||null)} />`}return r`<label class="field" style=${this.dim?"opacity:.6":""}>${i}${n}${this.dim?r`<span class="small muted">${e("node.unassigned")}</span>`:l}</label>`}};customElements.define("ot-field-input",Ee);var zt=["ok","missing","defective","to_sell","to_give_away","disposed"],Te=class extends u{constructor(){super();this._numberTouched=!1;this._nextNumber=null;this.mode="create",this.parentId=null,this.node=null,this._name="",this._kind="",this._number="",this._aliases="",this._tags="",this._owner="",this._quantity="",this._unit="",this._minQuantity="",this._note="",this._condition="ok",this._fieldValues={},this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},mode:{type:String},parentId:{attribute:!1},node:{attribute:!1},_name:{state:!0},_kind:{state:!0},_number:{state:!0},_aliases:{state:!0},_tags:{state:!0},_owner:{state:!0},_quantity:{state:!0},_unit:{state:!0},_minQuantity:{state:!0},_note:{state:!0},_condition:{state:!0},_fieldValues:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[p,v`
      form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      details {
        border-top: 1px solid var(--divider-color);
        padding-top: 8px;
      }
      summary {
        cursor: pointer;
        min-height: 44px;
        display: flex;
        align-items: center;
        color: var(--primary-color);
      }
      .two {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 12px;
      }
    `]}async connectedCallback(){super.connectedCallback();let e=this.node;if(this.mode==="edit"&&e)this._name=e.name,this._kind=e.kind,this._number=e.number!==null?String(e.number):"",this._numberTouched=!0,this._aliases=e.aliases.join(", "),this._tags=e.tags.join(", "),this._owner=e.owner??"",this._quantity=e.quantity!==null?String(e.quantity):"",this._unit=e.unit,this._minQuantity=e.min_quantity!==null?String(e.min_quantity):"",this._note=e.note,this._condition=e.condition,this._fieldValues=Object.fromEntries(e.fields.map(i=>[i.id,i.value??null]));else try{let i=await this.ctx.api.suggest(this.parentId);this._nextNumber=i.next_number,this._kind=i.kinds[0]??this.ctx.catalog?.kinds[0]?.id??"",this._syncNumber()}catch(i){this._error=h(i)}}get _kinds(){return this.ctx.catalog?.kinds??[]}get _numbered(){return this._kinds.find(e=>e.id===this._kind)?.numbered??!1}_syncNumber(){this.mode==="edit"||this._numberTouched||(this._number=this._numbered&&this._nextNumber!==null?String(this._nextNumber):"")}_input(e){return i=>{this[e]=i.target.value}}async _save(e){e?.preventDefault();let i=this.ctx.t,s=this._name.trim();if(!s){this._error=i("form.nameRequired");return}let n=Y(this._quantity),o=Y(this._minQuantity),d=this._number.trim()===""?null:Number.parseInt(this._number,10);if(n===void 0||o===void 0||d!==null&&!(d>=1)){this._error=i("form.numberInvalid");return}this._busy=!0,this._error="";try{if(this.mode==="create"){let c={name:s,kind:this._kind,aliases:S(this._aliases),tags:S(this._tags),note:this._note,unit:this._unit};this.parentId&&(c.parent=this.parentId),d!==null&&(c.number=d),this._owner&&(c.owner=this._owner),n!==null&&(c.quantity=n),o!==null&&(c.min_quantity=o);let g=await this.ctx.api.create(c);this._done("created",g.id,s)}else if(this.node){await this.ctx.api.update(this.node.id,{name:s,kind:this._kind,number:d,aliases:S(this._aliases),tags:S(this._tags),note:this._note,owner:this._owner||null,quantity:n,unit:this._unit,min_quantity:o,...this._condition!==this.node.condition?{condition:this._condition}:{}});for(let c of this.node.fields){let g=this._fieldValues[c.id]??null;JSON.stringify(g)!==JSON.stringify(c.value??null)&&await this.ctx.api.fieldValue(this.node.id,c.id,g)}this._done("saved",this.node.id,s)}}catch(c){this._error=h(c)}finally{this._busy=!1}}_done(e,i,s){this.dispatchEvent(new CustomEvent("saved",{detail:{kind:e,id:i,name:s},bubbles:!0,composed:!0}))}_fields(){let e=this.mode==="edit"?this.node?.fields??[]:[];if(!e.length)return l;let i=this.ctx.t,s="\0",n=e.some(o=>o.value!==null&&o.value!==void 0&&o.value!=="");return r`<details ?open=${n}>
      <summary>${i("form.fields")}</summary>
      <div class="stack" style="margin-top:8px">
        ${e.map(o=>{let d=o.group!==s?r`<div class="section-title" style="margin:8px 0 0">${o.group||i("form.fieldsOther")}</div>`:l;return s=o.group,r`${d}<ot-field-input
            .ctx=${this.ctx}
            .field=${o}
            .value=${this._fieldValues[o.id]??null}
            .dim=${!o.assigned}
            @value-changed=${c=>{this._fieldValues={...this._fieldValues,[c.detail.id]:c.detail.value}}}
          ></ot-field-input>`})}
      </div>
    </details>`}render(){let e=this.ctx.t,i=this.ctx.catalog?.persons??[],s=this.node?.effective_owner?.inherited?this.node.effective_owner.name:"",n=this.mode==="create"?e("form.createTitle"):e("form.editTitle");return r`
      <ot-dialog .heading=${n} .closeLabel=${e("common.close")}>
        <form @submit=${this._save} id="form">
          <label class="field">
            ${e("form.name")} *
            <input
              .value=${this._name}
              @input=${this._input("_name")}
              autocomplete="off"
              required
              aria-required="true"
              enterkeyhint="done"
            />
          </label>
          <div class="two">
            <label class="field">
              ${e("form.kind")}
              <select
                .value=${this._kind}
                @change=${o=>{this._kind=o.target.value,this._syncNumber()}}
              >
                ${this._kinds.map(o=>r`<option value=${o.id} ?selected=${o.id===this._kind}>${o.name}</option>`)}
              </select>
            </label>
            <label class="field">
              ${e("form.number")}
              <input
                type="number"
                inputmode="numeric"
                min="1"
                .value=${this._number}
                placeholder=${e("form.numberNone")}
                @input=${o=>{this._numberTouched=!0,this._number=o.target.value}}
              />
            </label>
          </div>
          <details>
            <summary>${e("form.more")}</summary>
            <div class="stack" style="margin-top:8px">
              <label class="field">${e("form.aliases")}<input .value=${this._aliases} @input=${this._input("_aliases")} /></label>
              <label class="field">${e("form.tags")}<input .value=${this._tags} @input=${this._input("_tags")} /></label>
              <label class="field">
                ${e("form.owner")}
                <select .value=${this._owner} @change=${this._input("_owner")}>
                  <option value="" ?selected=${this._owner===""}>${s?e("form.ownerInherited",{name:s}):e("form.ownerNone")}</option>
                  ${i.map(o=>r`<option value=${o.id} ?selected=${o.id===this._owner}>${o.name}</option>`)}
                </select>
              </label>
              <div class="two">
                <label class="field">${e("form.quantity")}<input inputmode="decimal" .value=${this._quantity} @input=${this._input("_quantity")} /></label>
                <label class="field">${e("form.unit")}<input .value=${this._unit} @input=${this._input("_unit")} /></label>
              </div>
              <label class="field">${e("form.minQuantity")}<input inputmode="decimal" .value=${this._minQuantity} @input=${this._input("_minQuantity")} /></label>
              ${this.mode==="edit"?r`<label class="field">
                    ${e("node.condition")}
                    <select .value=${this._condition} @change=${o=>this._condition=o.target.value}>
                      ${zt.map(o=>r`<option value=${o} ?selected=${o===this._condition}>${e(`condition.${o}`)}</option>`)}
                    </select>
                  </label>`:l}
              <label class="field">${e("form.note")}<textarea rows="3" .value=${this._note} @input=${this._input("_note")}></textarea></label>
            </div>
          </details>
          ${this._fields()}
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </form>
        <button slot="footer" class="btn text" @click=${()=>this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}>${e("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${()=>this._save()}>${e("common.save")}</button>
      </ot-dialog>
    `}};customElements.define("ot-node-form",Te);var b=class{constructor(){this.seq=0}async run(t){let e=++this.seq,i=await t();return e===this.seq?i:void 0}cancel(){this.seq++}};function x(a,t){let e,i=(...s)=>{clearTimeout(e),e=setTimeout(()=>a(...s),t)};return i.cancel=()=>clearTimeout(e),i.flush=(...s)=>{clearTimeout(e),a(...s)},i}var Bt=250,Se=class extends u{constructor(){super();this._latest=new b;this._refresh=x(async()=>{if(!this._text.trim()){this._latest.cancel(),this._preview=null;return}try{let e=await this._latest.run(()=>this.ctx.api.quickPreview(this._text,this._commas));e&&(this._preview=e,this._error="")}catch(e){this._error=h(e)}},Bt);this.parentId="",this.parentName="",this._text="",this._commas=!1,this._preview=null,this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},parentId:{type:String},parentName:{type:String},_text:{state:!0},_commas:{state:!0},_preview:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[p,v`
      textarea {
        min-height: 160px;
        font-size: 1rem;
        line-height: 1.5;
      }
      ul.preview {
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 0.95rem;
        line-height: 1.6;
      }
      .hint {
        font-size: 0.85rem;
        color: var(--secondary-text-color);
        line-height: 1.5;
      }
      code {
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        padding: 0 4px;
        border-radius: 4px;
      }
    `]}disconnectedCallback(){super.disconnectedCallback(),this._refresh.cancel(),this._latest.cancel()}_edit(e,i=this._commas){this._text=e,this._commas=i,this._refresh()}async _apply(){if(this._preview?.count){this._busy=!0;try{let e=await this.ctx.api.quickApply(this.parentId,this._text,this._commas);this.dispatchEvent(new CustomEvent("saved",{detail:{count:e.created.length},bubbles:!0,composed:!0}))}catch(e){this._error=h(e)}finally{this._busy=!1}}}render(){let e=this.ctx.t,i=this._preview?.count??0;return r`
      <ot-dialog .heading=${e("quick.title",{name:this.parentName})} .closeLabel=${e("common.close")} wide>
        <div class="stack">
          <textarea
            aria-label=${e("quick.title",{name:this.parentName})}
            placeholder=${e("quick.placeholder")}
            .value=${this._text}
            @input=${s=>this._edit(s.target.value)}
          ></textarea>
          <label class="check">
            <input type="checkbox" .checked=${this._commas} @change=${s=>this._edit(this._text,s.target.checked)} />
            ${e("quick.commas")}
          </label>
          <div class="hint">${e("quick.help")}</div>
          ${this._preview&&i>0?r`
                <div>
                  <h3>${e("quick.preview",{n:i})}</h3>
                  <ul class="preview" aria-live="polite">
                    ${this._preview.preview.map(s=>r`<li style="white-space:pre">${s}</li>`)}
                  </ul>
                </div>
              `:l}
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </div>
        <button slot="footer" class="btn text" @click=${()=>this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}>${e("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy||i===0} @click=${this._apply}>${e("quick.apply",{n:i})}</button>
      </ot-dialog>
    `}};customElements.define("ot-quickadd",Se);var Ut="unsortiert",gt="papierkorb",Ae=class extends u{constructor(){super();this._latest=new b;this._search=x(async()=>{let e=this._query.trim();if(!e){this._latest.cancel(),this._results=null;return}try{let i=await this._latest.run(async()=>{let s=A(e),n=[];if(s!==null)try{let d=await this.ctx.api.byNumber(s);n.push({...this._fromBrief(d,k(d.path,!1)),hasChildren:d.children>0})}catch{}let o=await this.ctx.api.search(e,{classes:["place","furniture","container","group"]},30);for(let d of o.hits){if(n.some(g=>g.id===d.id))continue;let c=this.ctx.catalog?.kinds.find(g=>g.id===d.kind);n.push({id:d.id,name:d.name,icon:y({icon:c?.icon??"",class:d.class}),number:d.number,subtitle:k(d.path,!1),hasChildren:!1})}return n});i&&(this._results=i)}catch(i){this._error=h(i)}},200);this.ids=[],this.startAt="",this._query="",this._results=null,this._browse={path:[],options:[]},this._recent=[],this._target=null,this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},ids:{attribute:!1},startAt:{type:String},_query:{state:!0},_results:{state:!0},_browse:{state:!0},_recent:{state:!0},_target:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[p,v`
      .opt {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--divider-color);
      }
      .opt:last-child {
        border-bottom: none;
      }
      .opt .main {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 52px;
        padding: 6px 10px;
        background: transparent;
        border: none;
        text-align: left;
      }
      .opt.sel .main {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
      }
      .opt .main[disabled] {
        opacity: 0.4;
      }
      .opt .down {
        width: 48px;
        border: none;
        border-left: 1px solid var(--divider-color);
        background: transparent;
      }
      .target {
        font-size: 0.95rem;
      }
    `]}async connectedCallback(){super.connectedCallback();try{let e=await this.ctx.api.user();this._recent=e.targets.filter(i=>!this.ids.includes(i.id)).map(i=>this._fromBrief(i))}catch{}await this._open(this.startAt||null)}disconnectedCallback(){super.disconnectedCallback(),this._latest.cancel(),this._search.cancel()}_fromBrief(e,i=""){return{id:e.id,name:e.name,icon:y(e),number:e.number,subtitle:i||e.kind_name,hasChildren:e.children>0}}async _open(e){try{let i=await this.ctx.api.node(e);if(e===null)this._browse={path:[],options:i.contents.filter(s=>s.id!==gt).map(s=>this._fromBrief(s))};else{let s=i;this._browse={path:s.path,options:s.contents.filter(n=>n.class!=="item").map(n=>this._fromBrief(n))}}}catch(i){this._error=h(i)}}_choose(e){this._target={id:e.id,label:e.subtitle&&e.id!==e.name?`${e.name}`:e.name},this._error=""}_disabled(e){return this.ids.includes(e)||e===gt}async _move(){if(this._target){this._busy=!0,this._error="";try{let e=this._target.id;await this.ctx.api.move(this.ids,e),e&&await this.ctx.api.addTarget(e).catch(()=>{}),this.dispatchEvent(new CustomEvent("saved",{detail:{count:this.ids.length,target:this._target.label},bubbles:!0,composed:!0}))}catch(e){this._error=h(e)}finally{this._busy=!1}}}_opt(e,i){let s=this.ctx.t,n=this._target?.id===e.id;return r`
      <div class="opt ${n?"sel":""}">
        <button class="main" ?disabled=${this._disabled(e.id)} aria-pressed=${n?"true":"false"} @click=${()=>this._choose(e)}>
          <ha-icon class="icon muted" icon=${e.icon}></ha-icon>
          <span class="grow">
            <span class="row">
              ${e.number!==null?r`<span class="badge">${e.number}</span>`:l}
              <span class="ellipsis">${e.name}</span>
            </span>
            <span class="small muted ellipsis" style="display:block">${e.subtitle}</span>
          </span>
        </button>
        ${i&&e.hasChildren&&!this._disabled(e.id)?r`<button class="down" aria-label=${s("move.open",{name:e.name})} @click=${()=>this._open(e.id)}><ha-icon icon="mdi:chevron-right"></ha-icon></button>`:l}
      </div>
    `}render(){let e=this.ctx.t,i=this.ids.length,s=this._browse.path[this._browse.path.length-1];return r`
      <ot-dialog .heading=${i===1?e("move.titleOne"):e("move.titleMany",{n:i})} .closeLabel=${e("common.close")} wide>
        <div class="stack">
          <label class="field">
            ${e("move.search")}
            <input
              type="search"
              .value=${this._query}
              placeholder=${e("move.searchPlaceholder")}
              @input=${n=>{this._query=n.target.value,this._search()}}
            />
          </label>
          ${this._results!==null?r`
                <div class="list">
                  ${this._results.length?this._results.map(n=>this._opt(n,!1)):r`<div class="empty">${e("search.none")}</div>`}
                </div>
              `:r`
                ${this._recent.length?r`<div>
                      <h3>${e("move.recent")}</h3>
                      <div class="list" style="margin-top:6px">${this._recent.map(n=>this._opt(n,!1))}</div>
                    </div>`:l}
                <div>
                  <h3>${e("move.browse")}</h3>
                  <ot-path
                    .path=${this._browse.path}
                    .rootLabel=${e("common.start")}
                    current
                    @open-node=${n=>this._open(n.detail)}
                  ></ot-path>
                  <div class="row wrap" style="margin:6px 0">
                    ${s?r`<button class="btn" ?disabled=${this._disabled(s.id)} @click=${()=>this._choose({id:s.id,name:s.name,icon:"",number:null,subtitle:"",hasChildren:!1})}>${e("move.chooseHere",{name:s.name})}</button>`:r`<button class="btn" @click=${()=>this._target={id:null,label:e("move.topLevel")}}>${e("move.topLevel")}</button>
                          <button class="btn" @click=${()=>this._target={id:Ut,label:e("overview.unsorted")}}>${e("overview.unsorted")}</button>`}
                  </div>
                  <div class="list">
                    ${this._browse.options.length?this._browse.options.map(n=>this._opt(n,!0)):r`<div class="empty small">${e("move.nothingBelow")}</div>`}
                  </div>
                </div>
              `}
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </div>
        <span slot="footer" class="grow target ellipsis">${this._target?e("move.target",{name:this._target.label}):e("move.noTarget")}</span>
        <button slot="footer" class="btn primary" ?disabled=${this._busy||!this._target} @click=${this._move}>${e("move.do")}</button>
      </ot-dialog>
    `}};customElements.define("ot-move",Ae);function O(a,t=""){let e=a.quantity!==null&&a.quantity!==void 0&&a.class==="item",i=[a.kind_name,e?"":I(a),t].filter(Boolean),s=a.class!=="item";return{id:a.id,name:a.name,icon:y(a),number:a.number,subtitle:i.join(" \xB7 "),hints:a.hints,counts:s?[a.children,a.descendants]:null,archived:a.archived,class:a.class,...e?{stepper:{quantity:a.quantity,unit:a.unit}}:{}}}function vt(a,t,e){return{id:a.id,name:a.name,icon:y({icon:e,class:a.class}),number:a.number,subtitle:[t,k(a.path,!1)].filter(Boolean).join(" \xB7 "),hints:a.hints,counts:null,archived:a.archived,class:a.class}}var ne=class{constructor(){this.ids=new Set;this.active=!1}get size(){return this.ids.size}has(t){return this.ids.has(t)}values(){return[...this.ids]}start(t){this.active=!0,this.ids.add(t)}toggle(t){this.ids.has(t)?this.ids.delete(t):this.ids.add(t),this.ids.size===0&&(this.active=!1)}selectAll(t){this.active=t.length>0,this.ids=new Set(t)}clear(){this.ids.clear(),this.active=!1}retain(t){let e=new Set(t);for(let i of[...this.ids])e.has(i)||this.ids.delete(i);this.ids.size===0&&(this.active=!1)}};var Ce=class extends u{static{this.properties={ctx:{attribute:!1},nodeId:{type:String},itemName:{type:String},kind:{type:String},_to:{state:!0},_since:{state:!0},_until:{state:!0},_note:{state:!0},_noReminder:{state:!0},_error:{state:!0},_busy:{state:!0}}}constructor(){super(),this.nodeId="",this.itemName="",this.kind="lent",this._to="",this._since=Q(),this._until="",this._note="",this._noReminder=!1,this._error="",this._busy=!1}static{this.styles=[p]}async _save(t){t?.preventDefault();let e=this.ctx.t,i=this._to.trim();if(!i){this._error=this.kind==="lent"?e("checkout.toRequiredLent"):e("checkout.toRequiredOut");return}this._busy=!0,this._error="";try{await this.ctx.api.checkout(this.nodeId,{checkout_type:this.kind,to:i,since:this._since||Q(),...this._until?{until:this._until}:{},...this._note.trim()?{note:this._note.trim()}:{},...this.kind==="lent"&&this._noReminder?{no_reminder:!0}:{}}),this.dispatchEvent(new CustomEvent("saved",{detail:{kind:"checkout",name:this.itemName},bubbles:!0,composed:!0}))}catch(s){this._error=h(s)}finally{this._busy=!1}}render(){let t=this.ctx.t,e=this.kind==="lent",i=this.ctx.catalog?.persons??[];return r`
      <ot-dialog .heading=${e?t("checkout.titleLent",{name:this.itemName}):t("checkout.titleOut",{name:this.itemName})} .closeLabel=${t("common.close")}>
        <form @submit=${this._save} class="stack">
          <label class="field">
            ${t(e?"checkout.toLent":"checkout.toOut")} *
            <input
              .value=${this._to}
              list="persons"
              autocomplete="off"
              required
              aria-required="true"
              placeholder=${t(e?"checkout.placeholderLent":"checkout.placeholderOut")}
              @input=${s=>this._to=s.target.value}
            />
            ${e?r`<datalist id="persons">${i.map(s=>r`<option value=${s.name}></option>`)}</datalist>`:l}
          </label>
          <div class="two" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px">
            <label class="field">${t("checkout.since")}<input type="date" .value=${this._since} @input=${s=>this._since=s.target.value} /></label>
            <label class="field">${t("checkout.until")}<input type="date" .value=${this._until} @input=${s=>this._until=s.target.value} /></label>
          </div>
          <label class="field">${t("form.note")}<textarea rows="2" .value=${this._note} @input=${s=>this._note=s.target.value}></textarea></label>
          ${e?r`<label class="row" style="gap:12px"><input type="checkbox" style="width:22px;min-height:0;height:22px" .checked=${this._noReminder} @change=${s=>this._noReminder=s.target.checked} /><span>${t("checkout.noReminder")}</span></label>
              <div class="small muted">${t("checkout.noReminderHelp")}</div>`:l}
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </form>
        <button slot="footer" class="btn text" @click=${()=>this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${()=>this._save()}>${t("common.save")}</button>
      </ot-dialog>
    `}};customElements.define("ot-checkout",Ce);var Kt=["days","weeks","months","years"],Le=class extends u{static{this.properties={ctx:{attribute:!1},nodeId:{type:String},task:{attribute:!1},_title:{state:!0},_value:{state:!0},_unit:{state:!0},_next:{state:!0},_note:{state:!0},_error:{state:!0},_busy:{state:!0}}}constructor(){super(),this.nodeId="",this.task=null,this._title="",this._value="",this._unit="months",this._next="",this._note="",this._error="",this._busy=!1}static{this.styles=[p]}connectedCallback(){super.connectedCallback();let t=this.task;t&&(this._title=t.title,this._value=t.interval?String(t.interval.value):"",this._unit=t.interval?.unit??"months",this._next=t.next_due??"",this._note=t.note??"")}_emit(t,e={}){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0,composed:!0}))}async _save(t){t?.preventDefault();let e=this.ctx.t,i=this._title.trim();if(!i){this._error=e("maintenance.titleRequired");return}let s=this._value.trim()===""?null:Number.parseInt(this._value,10);if(s!==null&&!(s>=1)){this._error=e("maintenance.intervalInvalid");return}let n=s===null?null:{value:s,unit:this._unit};this._busy=!0,this._error="";try{this.task?await this.ctx.api.maintenanceUpdate(this.nodeId,this.task.id,{title:i,interval:n,next_due:this._next||null,note:this._note}):await this.ctx.api.maintenanceAdd(this.nodeId,{title:i,interval:n,...this._next?{next_due:this._next}:{},...this._note.trim()?{note:this._note.trim()}:{}}),this._emit("saved",{kind:"maintenance"})}catch(o){this._error=h(o)}finally{this._busy=!1}}async _remove(){let t=this.ctx.t,e=this.task;if(!(!e||!await this.ctx.confirm({title:t("maintenance.deleteTitle",{name:e.title}),message:t("maintenance.deleteMessage"),confirmLabel:t("common.delete"),danger:!0})))try{await this.ctx.api.maintenanceRemove(this.nodeId,e.id),this._emit("saved",{kind:"maintenance-removed"})}catch(s){this._error=h(s)}}render(){let t=this.ctx.t;return r`
      <ot-dialog .heading=${this.task?t("maintenance.edit"):t("maintenance.new")} .closeLabel=${t("common.close")}>
        <form @submit=${this._save} class="stack">
          <label class="field">${t("maintenance.title")} *
            <input .value=${this._title} autocomplete="off" required aria-required="true" placeholder=${t("maintenance.titlePlaceholder")} @input=${e=>this._title=e.target.value} />
          </label>
          <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:12px">
            <label class="field">${t("maintenance.every")}
              <input type="number" inputmode="numeric" min="1" .value=${this._value} placeholder=${t("maintenance.once")} @input=${e=>this._value=e.target.value} />
            </label>
            <label class="field">${t("maintenance.unit")}
              <select .value=${this._unit} @change=${e=>this._unit=e.target.value}>
                ${Kt.map(e=>r`<option value=${e} ?selected=${e===this._unit}>${t(`maintenance.unit.${e}`)}</option>`)}
              </select>
            </label>
          </div>
          <label class="field">${t("maintenance.nextDue")}
            <input type="date" .value=${this._next} @input=${e=>this._next=e.target.value} />
          </label>
          <label class="field">${t("form.note")}<textarea rows="2" .value=${this._note} @input=${e=>this._note=e.target.value}></textarea></label>
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </form>
        ${this.task?r`<button slot="footer" class="btn text danger" @click=${this._remove}>${t("common.delete")}</button><span slot="footer" class="grow"></span>`:l}
        <button slot="footer" class="btn text" @click=${()=>this._emit("close")}>${t("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${()=>this._save()}>${t("common.save")}</button>
      </ot-dialog>
    `}};customElements.define("ot-maintenance",Le);var Ft=["unsortiert","papierkorb"],Ne=class extends u{constructor(){super();this._selection=new ne;this._latest=new b;this._loaded=null;this._closeDialog=()=>{this._dialog=null};this._saved=e=>{let i=this.ctx.t,s=e.detail;this._dialog=null,s.kind==="created"?this.ctx.toast(i("form.created",{name:s.name??""})):s.kind==="checkout"?this.ctx.toast(i("checkout.done",{name:s.name??""})):s.kind==="maintenance"?this.ctx.toast(i("maintenance.saved")):s.kind==="maintenance-removed"?this.ctx.toast(i("maintenance.removed")):s.kind==="saved"?this.ctx.toast(i("form.saved")):s.target!==void 0?(this.ctx.toast(i("move.done",{n:s.count??0,name:s.target})),this._selection.clear()):this.ctx.toast(i("quick.done",{n:s.count??0})),this._load()};this.nodeId=null,this._data=null,this._error="",this._dialog=null,this._moveIds=[],this._deleteMode="trash",this._favorite=!1,this._menu=!1,this._task=null}static{this.properties={ctx:{attribute:!1},nodeId:{attribute:!1},_data:{state:!0},_error:{state:!0},_dialog:{state:!0},_moveIds:{state:!0},_deleteMode:{state:!0},_favorite:{state:!0},_menu:{state:!0},_task:{state:!0}}}static{this.styles=[p,v`
      :host {
        display: block;
      }
      .head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 4px 0 8px;
      }
      .head h1 {
        font-size: 1.5rem;
        font-weight: 500;
        word-break: break-word;
      }
      .head .badge {
        font-size: 1.1rem;
      }
      .head ha-icon {
        --mdc-icon-size: 32px;
        color: var(--secondary-text-color);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 12px;
      }
      dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px 16px;
        margin: 0;
      }
      dt {
        color: var(--secondary-text-color);
      }
      dd {
        margin: 0;
        word-break: break-word;
      }
      dd.dim {
        opacity: 0.55;
      }
      .group-name {
        grid-column: 1 / -1;
        font-size: 0.8rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        margin-top: 8px;
      }
      .banner {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 12px 16px;
        border-radius: var(--ot-radius);
        background: color-mix(in srgb, var(--warning-color, #ff9800) 18%, transparent);
        margin-bottom: 12px;
      }
      .selbar {
        position: sticky;
        bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 28px;
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        z-index: 5;
      }
      .menu {
        position: relative;
      }
      .menu .pop {
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 6;
        min-width: 220px;
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        padding: 4px 0;
      }
      .menu .pop button {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 44px;
        padding: 0 16px;
        border: none;
        background: transparent;
        text-align: left;
      }
      .menu .pop button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
      .radio {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 8px 0;
      }
      .radio input {
        width: 22px;
        height: 22px;
        min-height: 0;
        margin-top: 2px;
      }
    `]}willUpdate(e){let i=this.ctx?.revision??0;if(!this._loaded||e.has("nodeId")||this._loaded.revision!==i){let s=this._loaded?.id===this.nodeId;this._loaded={id:this.nodeId,revision:i},s||(this._selection.clear(),this._menu=!1),this._load()}}async _load(){try{let e=this.nodeId,i=await this._latest.run(()=>this.ctx.api.node(e,{track:!0}));if(!i)return;if(this._data=i,this._error="",this._selection.retain(i.contents.map(s=>s.id)),e){let s=await this.ctx.api.user().catch(()=>null);this._favorite=!!s?.favorites.includes(e)}}catch(e){this._data=null,this._error=h(e)}}get _detail(){return this._data&&this._data.id!==null?this._data:null}_open(e){this.ctx.go({page:"node",id:e})}async _toggleFavorite(){let e=this._detail;if(e)try{await this.ctx.api.favorite(e.id,!this._favorite),this._favorite=!this._favorite}catch(i){this.ctx.toast(h(i),"error")}}async _restore(){let e=this._detail;if(e)try{await this.ctx.api.restore(e.id),this.ctx.toast(this.ctx.t("trash.restored",{name:e.name}))}catch(i){this.ctx.toast(h(i),"error")}}async _return(){let e=this._detail;if(e)try{await this.ctx.api.returnNode(e.id),this.ctx.toast(this.ctx.t("checkout.returned",{name:e.name}))}catch(i){this.ctx.toast(h(i),"error")}}async _toggleReminder(){let e=this._detail;if(e?.checkout)try{await this.ctx.api.checkoutReminder(e.id,!!e.checkout.no_reminder),this.ctx.toast(this.ctx.t(e.checkout.no_reminder?"checkout.reminderOn":"checkout.reminderOff"))}catch(i){this.ctx.toast(h(i),"error")}}async _taskDone(e){let i=this._detail;if(i)try{await this.ctx.api.maintenanceDone(i.id,e.id),this.ctx.toast(this.ctx.t("maintenance.doneToast",{title:e.title}))}catch(s){this.ctx.toast(h(s),"error")}}async _deleteSelected(){let e=this._selection.values(),i=this.ctx.t;if(await this.ctx.confirm({title:i("delete.manyTitle",{n:e.length}),message:i("delete.manyMessage",{n:e.length}),confirmLabel:i("common.delete"),danger:!0}))try{for(let n of e)await this.ctx.api.remove(n,"trash");this._selection.clear(),this.ctx.toast(i("delete.done",{n:e.length}))}catch(n){this.ctx.toast(h(n),"error")}}async _deleteOne(){let e=this._detail;if(e)try{await this.ctx.api.remove(e.id,this._deleteMode),this._dialog=null,this.ctx.toast(this.ctx.t("delete.doneOne",{name:e.name})),this._open(e.parent)}catch(i){this._dialog=null,this.ctx.toast(h(i),"error")}}render(){let e=this.ctx.t;if(this._error&&!this._data)return r`<div class="empty"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><p role="alert">${this._error}</p>
        <button class="btn" @click=${()=>this._open(null)}>${e("common.start")}</button></div>`;if(!this._data)return r`<div class="empty muted">${e("common.loading")}</div>`;let i=this._detail,s=this._data.contents.map(c=>O(c)),n=i?Ft.includes(i.id):!1,o=i?.in_trash??!1,d=!o&&i?.id!=="papierkorb";return r`
      ${i?r`<ot-path .path=${i.path} .rootLabel=${e("common.start")} current @open-node=${c=>this._open(c.detail)}></ot-path>`:l}
      ${this._head(i,n)}
      ${i&&o?this._trashBanner(i):l}
      ${d?r`
        <div class="actions">
          <button class="btn primary" @click=${()=>this._dialog="create"}><ha-icon icon="mdi:plus"></ha-icon>${e("node.new")}</button>
          ${i?r`<button class="btn" @click=${()=>this._dialog="quick"}><ha-icon icon="mdi:text-box-plus-outline"></ha-icon>${e("node.quick")}</button>`:l}
          ${s.length>1?r`<button class="btn text" @click=${()=>{this._selection.selectAll(s.map(c=>c.id)),this.requestUpdate()}}><ha-icon icon="mdi:select-all"></ha-icon>${e("node.selectAll")}</button>`:l}
        </div>`:l}
      ${i&&!n&&!o?this._checkoutActions(i):l}
      ${i?this._info(i):l}
      ${i&&!n&&!o?this._maintenance(i):l}
      <div class="section-title">${e("node.contents")}${s.length?` (${s.length})`:""}</div>
      ${s.length?r`<ot-node-list
            .ctx=${this.ctx}
            .rows=${s}
            .selection=${this._selection}
            .selectable=${!o}
            .label=${e("node.contents")}
            @open-node=${c=>this._open(c.detail)}
            @selection-changed=${()=>this.requestUpdate()}
          ></ot-node-list>`:this._empty(i)}
      ${this._selection.active?this._selectionBar():l}
      ${this._dialogs(i)}
    `}_head(e,i){let s=this.ctx.t;return e?r`
      <div class="head">
        <ha-icon icon=${y(e)}></ha-icon>
        ${e.number!==null?r`<span class="badge">${e.number}</span>`:l}
        <h1 class="grow">${e.name}</h1>
        ${!i&&!e.in_trash?r`<button class="icon-btn" aria-label=${this._favorite?s("node.unfavorite"):s("node.favorite")} aria-pressed=${this._favorite?"true":"false"} @click=${this._toggleFavorite}>
              <ha-icon icon=${this._favorite?"mdi:star":"mdi:star-outline"} style=${this._favorite?"color: var(--warning-color, #ffa600)":""}></ha-icon>
            </button>
            <div class="menu">
              <button class="icon-btn" aria-label=${s("node.more")} aria-haspopup="true" aria-expanded=${this._menu?"true":"false"} @click=${()=>this._menu=!this._menu}><ha-icon icon="mdi:dots-vertical"></ha-icon></button>
              ${this._menu?r`<div class="pop" role="menu">
                <button role="menuitem" @click=${()=>{this._menu=!1,this._dialog="edit"}}><ha-icon icon="mdi:pencil"></ha-icon>${s("common.edit")}</button>
                <button role="menuitem" @click=${()=>{this._menu=!1,this._moveIds=[e.id],this._dialog="move"}}><ha-icon icon="mdi:folder-move-outline"></ha-icon>${s("common.move")}</button>
                <button role="menuitem" @click=${()=>{this._menu=!1,this._deleteMode="trash",this._dialog="delete"}}><ha-icon icon="mdi:delete-outline"></ha-icon>${s("common.delete")}</button>
              </div>`:l}
            </div>`:l}
      </div>
    `:r`<div class="head"><ha-icon icon="mdi:home-variant-outline"></ha-icon><h1 class="grow">${s("node.rootTitle")}</h1>
        <a class="btn text" href="#" @click=${n=>{n.preventDefault(),this.ctx.go({page:"trash"})}}><ha-icon icon="mdi:delete-outline"></ha-icon>${s("nav.trash")}</a></div>`}_trashBanner(e){let i=this.ctx.t,s=e.parent==="papierkorb";return r`<div class="banner">
      <ha-icon icon="mdi:delete-clock-outline"></ha-icon>
      <span class="grow">${s?i("trash.bannerTop",{date:e.trashed?$(e.trashed.at.slice(0,10),this.ctx.lang):""}):i("trash.bannerInside")}</span>
      ${s?r`<button class="btn" @click=${this._restore}>${i("trash.restore")}</button>`:l}
    </div>`}_info(e){let i=this.ctx.t,s=this.ctx.lang,n=[];n.push([i("node.kind"),e.kind_name]),e.effective_owner&&n.push([i("node.owner"),e.effective_owner.inherited?`${e.effective_owner.name} (${i("node.inherited")})`:e.effective_owner.name]);let o=I(e);o&&n.push([i("node.quantity"),e.min_quantity!==null?`${o} (${i("node.minimum")} ${e.min_quantity})`:o]),e.aliases.length&&n.push([i("node.aliases"),e.aliases.join(", ")]),e.tags.length&&n.push([i("node.tags"),r`${e.tags.map(m=>r`<span class="chip" style="margin-right:4px">${m}</span>`)}`]);let d=e.effective_checkout;if(d){let m=d.type==="lent"?i("node.lentTo"):i("node.outAt"),f=`${d.to} \xB7 ${i("node.since")} ${$(d.since,s)}${d.until?` \xB7 ${i("node.until")} ${$(d.until,s)}`:""}`;n.push([m,d.inherited?`${f} (${i("node.viaContainer")})`:f])}e.condition!=="ok"&&n.push([i("node.condition"),i(`condition.${e.condition}`)]),e.note&&n.push([i("node.note"),r`<span style="white-space:pre-wrap">${e.note}</span>`]);let c=e.fields.filter(m=>m.value!==null&&m.value!==void 0&&m.value!=="");if(n.length<=1&&c.length===0&&e.hints.length===0)return l;let g="";return r`
      <div class="card">
        ${e.hints.length?r`<div class="row wrap" style="margin-bottom:10px">${e.hints.map(m=>r`<span class="chip ${se(m)}">${m.text}</span>`)}</div>`:l}
        <dl>
          ${n.map(([m,f])=>r`<dt>${m}</dt><dd>${f}</dd>`)}
          ${c.map(m=>{let f=m.group!==g&&m.group?r`<div class="group-name">${m.group}</div>`:l;return g=m.group,r`${f}<dt>${m.name}</dt><dd class=${m.assigned?"":"dim"} title=${m.assigned?"":i("node.unassigned")}>${pt(m,s,i("common.yes"),i("common.no"))}${m.assigned?"":` (${i("node.unassigned")})`}</dd>`})}
        </dl>
      </div>
    `}_checkoutActions(e){let i=this.ctx.t,s=e.checkout;return r`
      <div class="actions">
        ${s?r`<button class="btn primary" @click=${this._return}><ha-icon icon="mdi:keyboard-return"></ha-icon>${i("checkout.return")}</button>
              ${s.type==="lent"?r`<button class="btn text" @click=${this._toggleReminder}><ha-icon icon=${s.no_reminder?"mdi:bell-outline":"mdi:bell-off-outline"}></ha-icon>${s.no_reminder?i("checkout.reminderOnShort"):i("checkout.reminderOffShort")}</button>`:l}`:r`<button class="btn" @click=${()=>this._dialog="lent"}><ha-icon icon="mdi:account-arrow-right-outline"></ha-icon>${i("checkout.lend")}</button>
              <button class="btn" @click=${()=>this._dialog="out"}><ha-icon icon="mdi:package-up"></ha-icon>${i("checkout.takeOut")}</button>`}
        ${e.quantity!==null?r`<span class="grow"></span><ot-stepper .ctx=${this.ctx} .nodeId=${e.id} .itemName=${e.name} .quantity=${e.quantity} .unit=${e.unit}></ot-stepper>`:l}
      </div>
    `}_maintenance(e){let i=this.ctx.t,s=e.maintenance,n=Q();return r`
      <div class="section-title row">
        <span class="grow">${i("maintenance.section")}</span>
        <button class="btn text" @click=${()=>{this._task=null,this._dialog="task"}}><ha-icon icon="mdi:plus"></ha-icon>${i("maintenance.add")}</button>
      </div>
      ${s.length?r`<div class="list">${s.map(o=>{let d=o.next_due?ut(n,o.next_due):null,c=d!==null&&d<0,g=o.interval?i(`maintenance.unit.${o.interval.unit}`):"",m=[o.interval?i("maintenance.everyText",{n:o.interval.value,unit:g}):i("maintenance.once"),o.next_due?`${i("maintenance.due")} ${$(o.next_due,this.ctx.lang)}`:i("maintenance.noDate"),o.log?.length?i("maintenance.last",{date:$(o.log[o.log.length-1].date,this.ctx.lang)}):""].filter(Boolean);return r`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color)">
              <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${()=>{this._task=o,this._dialog="task"}} aria-label=${`${i("maintenance.edit")}: ${o.title}`}>
                <span class="grow">
                  <span class="title">${o.title}</span>
                  <span class="small muted" style="display:block">${m.join(" \xB7 ")}</span>
                  ${c?r`<span class="chip error" style="margin-top:4px">${i("due.overdue")}</span>`:d!==null&&d<=14?r`<span class="chip warning" style="margin-top:4px">${i("maintenance.soon",{n:d})}</span>`:l}
                </span>
              </button>
              <button class="btn" style="margin-right:8px" aria-label=${`${i("maintenance.done")}: ${o.title}`} @click=${()=>this._taskDone(o)}><ha-icon icon="mdi:check"></ha-icon>${i("maintenance.done")}</button>
            </div>`})}</div>`:r`<div class="small muted" style="padding:0 4px">${i("maintenance.none")}</div>`}
    `}_empty(e){let i=this.ctx.t;if(e?.in_trash)return r`<div class="empty small">${i("node.emptyTrashed")}</div>`;let s=e?e.class==="place"?"node.emptyPlace":e.class==="container"?"node.emptyContainer":e.class==="item"?"node.emptyItem":"node.emptyGeneric":"node.emptyRoot";return r`<div class="empty"><ha-icon icon="mdi:package-variant-closed"></ha-icon><p>${i(s)}</p></div>`}_selectionBar(){let e=this.ctx.t,i=this._selection.size;return r`<div class="selbar" role="toolbar" aria-label=${e("node.selection")}>
      <span class="grow">${e("node.selected",{n:i})}</span>
      <button class="btn" @click=${()=>{this._moveIds=this._selection.values(),this._dialog="move"}}><ha-icon icon="mdi:folder-move-outline"></ha-icon>${e("common.move")}</button>
      <button class="btn danger" @click=${this._deleteSelected}><ha-icon icon="mdi:delete-outline"></ha-icon>${e("common.delete")}</button>
      <button class="icon-btn" aria-label=${e("common.cancel")} @click=${()=>{this._selection.clear(),this.requestUpdate()}}><ha-icon icon="mdi:close"></ha-icon></button>
    </div>`}_dialogs(e){let i=this.ctx.t;switch(this._dialog){case"create":return r`<ot-node-form .ctx=${this.ctx} mode="create" .parentId=${e?.id??null} @saved=${this._saved} @close=${this._closeDialog}></ot-node-form>`;case"edit":return e?r`<ot-node-form .ctx=${this.ctx} mode="edit" .node=${e} @saved=${this._saved} @close=${this._closeDialog}></ot-node-form>`:l;case"quick":return e?r`<ot-quickadd .ctx=${this.ctx} .parentId=${e.id} .parentName=${e.name} @saved=${this._saved} @close=${this._closeDialog}></ot-quickadd>`:l;case"move":return r`<ot-move .ctx=${this.ctx} .ids=${this._moveIds} .startAt=${e?.id??""} @saved=${this._saved} @close=${this._closeDialog}></ot-move>`;case"delete":return e?this._deleteDialog(e,i):l;case"lent":case"out":return e?r`<ot-checkout .ctx=${this.ctx} .nodeId=${e.id} .itemName=${e.name} .kind=${this._dialog} @saved=${this._saved} @close=${this._closeDialog}></ot-checkout>`:l;case"task":return e?r`<ot-maintenance .ctx=${this.ctx} .nodeId=${e.id} .task=${this._task} @saved=${this._saved} @close=${this._closeDialog}></ot-maintenance>`:l;default:return l}}_deleteDialog(e,i){let s=e.descendants;return r`
      <ot-dialog .heading=${i("delete.title",{name:e.name})} .closeLabel=${i("common.close")} @close=${this._closeDialog}>
        <p style="margin-top:0">${s>0?i("delete.withContent",{n:s}):i("delete.empty")}</p>
        ${s>0?r`
              <label class="radio"><input type="radio" name="mode" .checked=${this._deleteMode==="trash"} @change=${()=>this._deleteMode="trash"} /><span>${i("delete.modeTrash",{n:s})}</span></label>
              <label class="radio"><input type="radio" name="mode" .checked=${this._deleteMode==="lift"} @change=${()=>this._deleteMode="lift"} /><span>${i("delete.modeLift")}</span></label>
            `:l}
        <p class="small muted">${i("delete.trashInfo",{days:this.ctx.catalog?.settings.trash_days??30})}</p>
        <button slot="footer" class="btn text" @click=${this._closeDialog}>${i("common.cancel")}</button>
        <button slot="footer" class="btn danger" @click=${this._deleteOne}>${i("common.delete")}</button>
      </ot-dialog>
    `}};customElements.define("ot-node-page",Ne);var Pe=class extends u{constructor(){super();this._latest=new b;this._revision=-1;this._data=null,this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},_data:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[p,v`
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }
      .tile {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 92px;
        padding: 14px 16px;
        border-radius: var(--ot-radius);
        border: 1px solid var(--divider-color);
        background: var(--card-background-color, #fff);
        text-align: left;
      }
      .tile:hover {
        border-color: var(--primary-color);
      }
      .tile .n {
        font-size: 1.9rem;
        font-weight: 500;
        line-height: 1.1;
      }
      .tile .l {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
      }
      .tile.alert .n {
        color: var(--warning-color, #ff9800);
      }
      .tile.bad .n {
        color: var(--error-color, #db4437);
      }
      .intro {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
        padding: 28px 16px;
      }
      .intro ha-icon {
        --mdc-icon-size: 56px;
        color: var(--primary-color);
      }
    `]}willUpdate(){let e=this.ctx?.revision??0;this._revision!==e&&(this._revision=e,this._load())}async _load(){try{let e=await this._latest.run(()=>this.ctx.api.overview());e&&(this._data=e,this._error="")}catch(e){this._error=h(e)}}_open(e){this.ctx.go({page:"node",id:e})}async _sample(e){this._busy=!0;try{if(e)await this.ctx.api.sampleLoad();else{if(!await this.ctx.confirm({title:this.ctx.t("sample.removeTitle"),message:this.ctx.t("sample.removeMessage"),confirmLabel:this.ctx.t("sample.remove"),danger:!0}))return;await this.ctx.api.sampleRemove()}this.ctx.toast(this.ctx.t(e?"sample.loaded":"sample.removed")),await this.ctx.reloadCatalog()}catch(i){this.ctx.toast(h(i),"error")}finally{this._busy=!1}}render(){let e=this.ctx.t;if(this._error&&!this._data)return r`<div class="empty error-text" role="alert">${this._error}</div>`;let i=this._data;if(!i)return r`<div class="empty muted">${e("common.loading")}</div>`;let s=i.overview,n=Object.entries(s.due).filter(([c])=>c!=="below_min").reduce((c,[,g])=>c+g,0),o=this.ctx.status?.inventory_empty??!1,d=s.total_value;return r`
      ${o&&!this.ctx.catalog?.sample_loaded?r`<div class="card intro">
            <ha-icon icon="mdi:package-variant"></ha-icon>
            <h2>${e("overview.welcome")}</h2>
            <p class="muted" style="margin:0;max-width:34em">${e("overview.welcomeText")}</p>
            <div class="row wrap" style="justify-content:center">
              <button class="btn primary" @click=${()=>this.ctx.go({page:"node",id:null})}>${e("overview.start")}</button>
              <button class="btn" ?disabled=${this._busy} @click=${()=>this._sample(!0)}>${e("sample.load")}</button>
            </div>
          </div>`:l}
      <div class="tiles" style="margin-top:12px">
        ${this._tile(String(s.containers),e("overview.containers"),()=>this.ctx.go({page:"search",query:"",filters:{classes:["container"]}}))}
        ${this._tile(String(s.items),e("overview.items"),()=>this.ctx.go({page:"search",query:"",filters:{classes:["item"]}}))}
        ${this._tile(String(s.unsorted),e("overview.unsorted"),()=>this._open("unsortiert"),s.unsorted>0?"alert":"")}
        ${this._tile(String(s.checked_out),e("overview.checkedOut"),()=>this.ctx.go({page:"out"}),s.checked_out_overdue>0?"alert":"")}
        ${this._tile(String(n),e("overview.due"),()=>this.ctx.go({page:"due"}),n>0?"alert":"")}
        ${this._tile(String(s.due.below_min??0),e("overview.restock"),()=>this.ctx.go({page:"restock"}),(s.due.below_min??0)>0?"alert":"")}
      </div>
      <div class="row wrap muted small" style="margin:12px 4px 0;gap:16px">
        <span><ha-icon icon="mdi:numeric" style="--mdc-icon-size:18px"></ha-icon> ${e("overview.nextNumber",{n:s.next_free_number})}</span>
        ${d!==null?r`<span><ha-icon icon="mdi:cash" style="--mdc-icon-size:18px"></ha-icon> ${e("overview.value",{value:this._money(d)})}</span>`:l}
        <a href="#" @click=${c=>{c.preventDefault(),this.ctx.go({page:"trash"})}}>${e("nav.trash")}</a>
      </div>
      ${Object.keys(s.value_per_place).length?r`<div class="small muted" style="margin:6px 4px 0">${Object.entries(s.value_per_place).map(([c,g])=>`${c}: ${this._money(g)}`).join(" \xB7 ")}</div>`:l}
      ${this._section(e("overview.favorites"),i.favorites,e("overview.favoritesEmpty"))}
      ${this._section(e("overview.recent"),i.recent,e("overview.recentEmpty"))}
      ${s.empty_containers.length?this._section(e("overview.emptyContainers"),s.empty_containers,""):l}
      ${this.ctx.catalog?.sample_loaded?r`<div class="row" style="margin-top:20px"><span class="muted small grow">${e("sample.active")}</span><button class="btn text" ?disabled=${this._busy} @click=${()=>this._sample(!1)}>${e("sample.remove")}</button></div>`:l}
    `}_money(e){return new Intl.NumberFormat(this.ctx.lang,{style:"currency",currency:"EUR"}).format(e)}_tile(e,i,s,n=""){return r`<button class="tile ${n}" @click=${s}><span class="n">${e}</span><span class="l">${i}</span></button>`}_section(e,i,s){return r`
      <div class="section-title">${e}</div>
      ${i.length?r`<ot-node-list .rows=${i.map(n=>O(n))} .label=${e} @open-node=${n=>this._open(n.detail)}></ot-node-list>`:s?r`<div class="small muted" style="margin:0 4px">${s}</div>`:l}
    `}};customElements.define("ot-overview",Pe);var ft=["place","furniture","container","group","item"],jt=["checked_out","has_number","empty","stale","include_archived"],Wt={checked_out:"search.fOut",has_number:"search.fNumber",empty:"search.fEmpty",stale:"search.fStale",include_archived:"search.fArchived"},Re=class extends u{constructor(){super();this._latest=new b;this._key="";this.query="",this.filters={},this._hits=null,this._total=0,this._numberHit=null,this._loading=!1,this._error="",this._open=!1}static{this.properties={ctx:{attribute:!1},query:{type:String},filters:{attribute:!1},_hits:{state:!0},_total:{state:!0},_numberHit:{state:!0},_loading:{state:!0},_error:{state:!0},_open:{state:!0}}}static{this.styles=[p,v`
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      details.panel {
        margin: 4px 0 12px;
      }
      details.panel > summary {
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: var(--primary-color);
      }
      .selects {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin: 8px 0;
      }
      .jump {
        margin-bottom: 8px;
      }
    `]}willUpdate(){let e=JSON.stringify([this.query,this.filters,this.ctx?.revision]);e!==this._key&&(this._key=e,this._run())}async _run(){this._loading=!0;try{let e=await this._latest.run(()=>this.ctx.api.search(this.query,this.filters,200));if(!e)return;this._hits=e.hits,this._total=e.total,this._numberHit=e.number_hit,this._error="",this._loading=!1}catch(e){this._error=h(e),this._loading=!1}}_set(e){let i={...this.filters,...e};for(let s of Object.keys(i)){let n=i[s];(n===void 0||n===""||Array.isArray(n)&&n.length===0||n===!1)&&delete i[s]}this.ctx.go({page:"search",query:this.query,filters:i},{replace:!0})}_toggleClass(e){let i=new Set(this.filters.classes??[]);i.has(e)?i.delete(e):i.add(e),this._set({classes:ft.filter(s=>i.has(s))})}get _activeCount(){let e=this.filters;return Object.keys(e).filter(i=>!(i==="checked_out"&&e.checked_out===void 0)).length}render(){let e=this.ctx.t,i=this.filters,s=this.ctx.catalog?.kinds??[],n=this.ctx.catalog?.persons??[],o=(this._hits??[]).map(c=>{let g=s.find(m=>m.id===c.kind);return vt(c,g?.name??"",g?.icon??"")}),d=this._numberHit?this._hits?.find(c=>c.id===this._numberHit):void 0;return r`
      <div class="filters" role="group" aria-label=${e("search.filter")}>
        ${ft.map(c=>r`<button class="chip" aria-pressed=${i.classes?.includes(c)?"true":"false"} @click=${()=>this._toggleClass(c)}>${e(`class.${c}`)}</button>`)}
      </div>
      <details class="panel" ?open=${this._open} @toggle=${c=>this._open=c.target.open}>
        <summary><ha-icon icon="mdi:filter-variant"></ha-icon>${e("search.moreFilters")}${this._activeCount?` (${this._activeCount})`:""}</summary>
        <div class="selects">
          <label class="field">${e("search.kind")}
            <select .value=${i.kinds?.[0]??""} @change=${c=>this._set({kinds:c.target.value?[c.target.value]:void 0})}>
              <option value="">${e("search.any")}</option>
              ${s.map(c=>r`<option value=${c.id} ?selected=${i.kinds?.[0]===c.id}>${c.name}</option>`)}
            </select></label>
          <label class="field">${e("search.owner")}
            <select .value=${i.owner??""} @change=${c=>this._set({owner:c.target.value||void 0})}>
              <option value="">${e("search.any")}</option>
              ${n.map(c=>r`<option value=${c.id} ?selected=${i.owner===c.id}>${c.name}</option>`)}
            </select></label>
          <label class="field">${e("search.condition")}
            <select .value=${i.condition??""} @change=${c=>this._set({condition:c.target.value||void 0})}>
              <option value="">${e("search.any")}</option>
              ${["missing","defective","to_sell","to_give_away","disposed"].map(c=>r`<option value=${c} ?selected=${i.condition===c}>${e(`condition.${c}`)}</option>`)}
            </select></label>
          <label class="field">${e("search.tag")}
            <input .value=${i.tag??""} @change=${c=>this._set({tag:c.target.value.trim()||void 0})} /></label>
        </div>
        <div class="filters">
          ${jt.map(c=>r`<button class="chip" aria-pressed=${i[c]?"true":"false"} @click=${()=>this._set({[c]:i[c]?void 0:!0})}>${e(Wt[c])}</button>`)}
          ${i.within?r`<button class="chip" aria-pressed="true" @click=${()=>this._set({within:void 0})}>${e("search.within")} ✕</button>`:l}
          ${this._activeCount?r`<button class="btn text" @click=${()=>this.ctx.go({page:"search",query:this.query,filters:{}},{replace:!0})}>${e("search.reset")}</button>`:l}
        </div>
      </details>
      ${d?r`<button class="btn primary jump" @click=${()=>this.ctx.go({page:"node",id:d.id})}><ha-icon icon="mdi:arrow-right-bold"></ha-icon>${e("search.jump",{name:d.name})}</button>`:l}
      ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
      <div class="small muted" style="margin:0 4px 8px" aria-live="polite">
        ${this._hits===null?e("common.loading"):this._total===0?"":e(this._total>o.length?"search.countMore":"search.count",{n:this._total,shown:o.length})}
      </div>
      ${o.length?r`<ot-node-list .rows=${o} .showCounts=${!1} .label=${e("search.results")} @open-node=${c=>this.ctx.go({page:"node",id:c.detail})}></ot-node-list>`:this._hits!==null&&!this._loading?r`<div class="empty"><ha-icon icon="mdi:magnify-close"></ha-icon><p>${e("search.none")}</p></div>`:l}
    `}};customElements.define("ot-search-page",Re);var De=class extends u{constructor(){super();this._latest=new b;this._revision=-1;this._entries=null,this._error=""}static{this.properties={ctx:{attribute:!1},_entries:{state:!0},_error:{state:!0}}}static{this.styles=[p,v`
      .entry {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 8px 8px 12px;
        border-bottom: 1px solid var(--divider-color);
      }
      .entry:last-child {
        border-bottom: none;
      }
    `]}willUpdate(){let e=this.ctx?.revision??0;e!==this._revision&&(this._revision=e,this._load())}async _load(){try{let e=await this._latest.run(()=>this.ctx.api.trash());e&&(this._entries=e)}catch(e){this._error=h(e)}}async _restore(e){try{let s=(await this.ctx.api.restore(e.id)).parent==="unsortiert";this.ctx.toast(this.ctx.t(s?"trash.restoredUnsorted":"trash.restored",{name:e.name}))}catch(i){this.ctx.toast(h(i),"error")}}async _purge(e){let i=this.ctx.t;if(await this.ctx.confirm({title:i("trash.purgeTitle",{name:e.name}),message:i("trash.purgeMessage",{n:e.descendants}),confirmLabel:i("trash.purge"),danger:!0}))try{await this.ctx.api.purge(e.id)}catch(n){this.ctx.toast(h(n),"error")}}async _empty(){let e=this.ctx.t;if(await this.ctx.confirm({title:e("trash.emptyTitle"),message:e("trash.emptyMessage"),confirmLabel:e("trash.empty"),danger:!0}))try{let s=await this.ctx.api.emptyTrash();this.ctx.toast(e("trash.emptied",{n:s.removed}))}catch(s){this.ctx.toast(h(s),"error")}}render(){let e=this.ctx.t,i=this.ctx.catalog?.settings.trash_days??30;return r`
      <div class="row" style="margin:4px 0 8px">
        <h1 class="grow" style="font-size:1.5rem;font-weight:500">${e("nav.trash")}</h1>
        <button class="btn danger" ?disabled=${!this._entries?.length} @click=${this._empty}><ha-icon icon="mdi:delete-forever-outline"></ha-icon>${e("trash.empty")}</button>
      </div>
      <p class="muted small" style="margin:0 4px 12px">${e("trash.info",{days:i})}</p>
      ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:""}
      ${this._entries===null?r`<div class="empty muted">${e("common.loading")}</div>`:this._entries.length===0?r`<div class="empty"><ha-icon icon="mdi:delete-empty-outline"></ha-icon><p>${e("trash.none")}</p></div>`:r`<div class="list">
              ${this._entries.map(s=>r`<div class="entry">
                  <ha-icon class="icon muted" icon=${y(s)}></ha-icon>
                  <span class="grow">
                    <button class="btn text" style="padding:0;min-height:0;font-size:1rem;display:block" @click=${()=>this.ctx.go({page:"node",id:s.id})}>${s.number!==null?`${s.number} \xB7 `:""}${s.name}</button>
                    <span class="small muted">${s.kind_name}${s.descendants?` \xB7 ${e("trash.withContent",{n:s.descendants})}`:""}${s.trashed?` \xB7 ${e("trash.deletedOn",{date:$(s.trashed.at.slice(0,10),this.ctx.lang)})}`:""}</span>
                  </span>
                  <button class="icon-btn" aria-label=${e("trash.restore")} title=${e("trash.restore")} @click=${()=>this._restore(s)}><ha-icon icon="mdi:restore"></ha-icon></button>
                  <button class="icon-btn" aria-label=${e("trash.purge")} title=${e("trash.purge")} @click=${()=>this._purge(s)}><ha-icon icon="mdi:delete-forever-outline"></ha-icon></button>
                </div>`)}
            </div>`}
    `}};customElements.define("ot-trash-page",De);var Vt=["expiring","checkout_overdue","below_min","maintenance_due","missing"],Me=class extends u{constructor(){super();this._latest=new b;this._revision=-1;this.only="",this._data=null,this._error=""}static{this.properties={ctx:{attribute:!1},only:{type:String},_data:{state:!0},_error:{state:!0}}}static{this.styles=[p]}willUpdate(){let e=this.ctx?.revision??0;e!==this._revision&&(this._revision=e,this._load())}async _load(){try{let e=await this._latest.run(()=>this.ctx.api.due());e&&(this._data=e.categories,this._error="")}catch(e){this._error=h(e)}}async _run(e,i){try{await e(),this.ctx.toast(i)}catch(s){this.ctx.toast(h(s),"error")}}async _transfer(){let e=this.ctx.t;try{let i=await this.ctx.api.todoTransfer();this.ctx.toast(e("restock.transferred",{added:i.added,skipped:i.skipped}))}catch(i){this.ctx.toast(h(i),"error")}}render(){let e=this.ctx.t;if(this._error&&!this._data)return r`<div class="error-text" role="alert">${this._error}</div>`;if(!this._data)return r`<div class="empty muted">${e("common.loading")}</div>`;let i=this._data,s=this.only?[this.only]:Vt,n=s.reduce((d,c)=>d+(i[c]?.length??0),0),o=this.only==="below_min";return r`
      <div class="row" style="margin:4px 0 12px">
        <h1 class="grow" style="font-size:1.5rem;font-weight:500">${e(o?"restock.title":"due.title")}</h1>
        ${o&&n>0&&this.ctx.status?.todo_entity?r`<button class="btn" @click=${this._transfer}><ha-icon icon="mdi:cart-arrow-right"></ha-icon>${e("restock.toTodo")}</button>`:l}
      </div>
      ${o&&n>0&&!this.ctx.status?.todo_entity?r`<p class="small muted">${e("restock.noTodo")}</p>`:l}
      ${n===0?r`<div class="empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon><p>${e(o?"restock.none":"due.none")}</p></div>`:l}
      ${s.map(d=>{let c=i[d]??[];return c.length?r`
          ${this.only?l:r`<div class="section-title">${e(`due.${d}`)} (${c.length})</div>`}
          <div class="list">${c.map(g=>this._item(d,g))}</div>
        `:l})}
    `}_item(e,i){let s=this.ctx.t,n=this.ctx.lang,o=e==="below_min"&&i.min_quantity!=null?`${s("node.minimum")} ${i.min_quantity}`:i.due?$(i.due,n):"",d=[i.detail&&e!=="below_min"?i.detail:"",o,i.path].filter(Boolean).join(" \xB7 ");return r`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color)">
      <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${()=>this.ctx.go({page:"node",id:i.node_id})}>
        <span class="grow">
          <span class="title">${i.name}</span>
          <span class="small muted" style="display:block">${d}</span>
          ${i.overdue?r`<span class="chip error" style="margin-top:4px">${s("due.overdue")}</span>`:l}
        </span>
      </button>
      ${e==="below_min"&&i.quantity!=null?r`<ot-stepper .ctx=${this.ctx} .nodeId=${i.node_id} .itemName=${i.name} .quantity=${i.quantity} .unit=${i.unit??""}></ot-stepper>`:e==="checkout_overdue"?r`<button class="btn" style="margin-right:8px" @click=${()=>this._run(()=>this.ctx.api.returnNode(i.node_id),s("checkout.returned",{name:i.name}))}>${s("checkout.return")}</button>`:e==="maintenance_due"?r`<button class="btn" style="margin-right:8px" @click=${()=>this._run(()=>this.ctx.api.maintenanceDone(i.node_id,i.key.split("|")[2]),s("maintenance.doneToast",{title:i.detail}))}><ha-icon icon="mdi:check"></ha-icon>${s("maintenance.done")}</button>`:l}
    </div>`}};customElements.define("ot-due-page",Me);var qe=class extends u{constructor(){super();this._latest=new b;this._revision=-1;this._rows=null,this._error=""}static{this.properties={ctx:{attribute:!1},_rows:{state:!0},_error:{state:!0}}}static{this.styles=[p]}willUpdate(){let e=this.ctx?.revision??0;e!==this._revision&&(this._revision=e,this._load())}async _load(){try{let e=await this._latest.run(()=>this.ctx.api.checkouts());e&&(this._rows=e,this._error="")}catch(e){this._error=h(e)}}async _return(e){try{await this.ctx.api.returnNode(e.id),this.ctx.toast(this.ctx.t("checkout.returned",{name:e.name}))}catch(i){this.ctx.toast(h(i),"error")}}render(){let e=this.ctx.t;return this._error&&!this._rows?r`<div class="error-text" role="alert">${this._error}</div>`:this._rows?r`
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0 12px">${e("out.title")}</h1>
      ${this._rows.length===0?r`<div class="empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon><p>${e("out.none")}</p></div>`:r`<div class="list">${this._rows.map(i=>this._row(i))}</div>`}
    `:r`<div class="empty muted">${e("common.loading")}</div>`}_row(e){let i=this.ctx.t,s=this.ctx.lang,n=e.type==="lent"?i("node.lentTo"):i("node.outAt"),o=e.path.length?` \xB7 ${i("out.home",{path:e.path.join(" \u203A ")})}`:"";return r`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color)">
      <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${()=>this.ctx.go({page:"node",id:e.id})}>
        <ha-icon class="icon" icon=${e.type==="lent"?"mdi:account-arrow-right-outline":"mdi:package-up"}></ha-icon>
        <span class="grow">
          <span class="title">${e.name}</span>
          <span class="small muted" style="display:block">${n} ${e.to} · ${i("node.since")} ${$(e.since,s)}${e.until?` \xB7 ${i("node.until")} ${$(e.until,s)}`:""}${o}</span>
          <span class="small" style="display:block">${i("out.days",{n:e.days_out})}</span>
          ${e.overdue?r`<span class="chip error" style="margin-top:4px">${i("due.overdue")}</span>`:l}
        </span>
      </button>
      <button class="btn" style="margin-right:8px" @click=${()=>this._return(e)}>${i("checkout.return")}</button>
    </div>`}};customElements.define("ot-out-page",qe);var M=class extends Error{constructor(e,i){super(i);this.code=e;this.name="ApiError"}},bt="ordnungstracker/",z=class{constructor(t){this.hass=t;this.status=()=>this.call("status");this.overview=()=>this.call("overview");this.catalog=()=>this.call("catalog");this.user=()=>this.call("user");this.due=()=>this.call("due");this.trash=()=>this.call("trash");this.byNumber=t=>this.call("by_number",{number:t});this.suggest=t=>this.call("suggest",t?{parent:t}:{});this.create=t=>this.call("create",t);this.update=(t,e)=>this.call("update",{node_id:t,changes:e});this.move=(t,e)=>this.call("move",{ids:t,parent:e});this.remove=(t,e)=>this.call("delete",{node_id:t,mode:e});this.restore=t=>this.call("restore",{node_id:t});this.purge=t=>this.call("purge",{node_id:t});this.emptyTrash=()=>this.call("trash_empty");this.favorite=(t,e)=>this.call("favorite",{node_id:t,value:e});this.addTarget=t=>this.call("target_add",{node_id:t});this.quickPreview=(t,e)=>this.call("quickadd_preview",{text:t,split_commas:e});this.quickApply=(t,e,i)=>this.call("quickadd_apply",{parent:t,text:e,split_commas:i});this.checkouts=()=>this.call("checkouts");this.checkout=(t,e)=>this.call("checkout",{node_id:t,...e});this.returnNode=t=>this.call("return",{node_id:t});this.checkoutReminder=(t,e)=>this.call("checkout_reminder",{node_id:t,enabled:e});this.quantityStep=(t,e)=>this.call("quantity",{node_id:t,delta:e});this.quantitySet=(t,e)=>this.call("quantity",{node_id:t,quantity:e});this.fieldValue=(t,e,i)=>this.call("field_value",{node_id:t,field:e,value:i});this.maintenanceAdd=(t,e)=>this.call("maintenance_add",{node_id:t,...e});this.maintenanceUpdate=(t,e,i)=>this.call("maintenance_update",{node_id:t,task:e,changes:i});this.maintenanceRemove=(t,e)=>this.call("maintenance_remove",{node_id:t,task:e});this.maintenanceDone=(t,e,i)=>this.call("maintenance_done",{node_id:t,task:e,...i?{note:i}:{}});this.fieldDefAdd=t=>this.call("field_def_add",t);this.fieldDefUpdate=(t,e)=>this.call("field_def_update",{field_id:t,changes:e});this.fieldDefDelete=t=>this.call("field_def_delete",{field_id:t});this.synonyms=t=>this.call("synonyms",{groups:t});this.settings=t=>this.call("settings",{settings:t});this.todoTransfer=()=>this.call("todo_transfer");this.kindAdd=t=>this.call("kind_add",t);this.kindUpdate=(t,e)=>this.call("kind_update",{kind_id:t,changes:e});this.kindDelete=(t,e)=>this.call("kind_delete",e?{kind_id:t,replacement:e}:{kind_id:t});this.personAdd=(t,e)=>this.call("person_add",e?{name:t,ha_person:e}:{name:t});this.personUpdate=(t,e)=>this.call("person_update",{person_id:t,changes:e});this.personDelete=t=>this.call("person_delete",{person_id:t});this.exportData=(t,e)=>this.call("export",e?{format:t,node_id:e}:{format:t});this.importText=t=>this.call("import",{text:t});this.sampleLoad=()=>this.call("sample_load");this.sampleRemove=()=>this.call("sample_remove")}setHass(t){this.hass=t}async call(t,e={}){try{return await this.hass.callWS({type:bt+t,...e})}catch(i){let s=i;throw new M(s?.code??"unknown",s?.message??String(i))}}node(t,e={}){return this.call("node",{node_id:t,track:e.track??!1,include_archived:e.archived??!1})}search(t,e={},i=100){return this.call("search",{query:t,filters:e,limit:i})}subscribe(t){return this.hass.connection.subscribeMessage(t,{type:bt+"subscribe"})}};var He=class extends u{constructor(){super();this._latest=new b;this._search=x(async()=>{let e=this._query.trim();if(!e){this._latest.cancel(),this._hits=[];return}let i=A(e);try{if(i!==null){let n=await this._latest.run(()=>this.ctx.api.byNumber(i).catch(()=>null));n!==void 0&&(this._hits=n?[{id:n.id,name:n.name,kind:n.kind,class:n.class,number:n.number,path:n.path,owner:null,owner_inherited:!1,hints:[],matched_in:"",archived:!1}]:[]);return}let s=await this._latest.run(()=>this.ctx.api.search(e,{},6));s&&(this._hits=s.hits)}catch{this._hits=[]}},250);this.label="",this.value="",this.valueName="",this._query="",this._hits=[]}static{this.properties={ctx:{attribute:!1},label:{type:String},value:{type:String},valueName:{type:String},_query:{state:!0},_hits:{state:!0}}}static{this.styles=[p,v`
      .hits {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
        margin-top: 4px;
      }
      .hits button {
        display: block;
        width: 100%;
        min-height: 44px;
        text-align: left;
        border: none;
        border-bottom: 1px solid var(--divider-color);
        background: transparent;
        padding: 6px 12px;
      }
      .hits button:last-child {
        border-bottom: none;
      }
      .hits button:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
    `]}disconnectedCallback(){super.disconnectedCallback(),this._search.cancel()}_pick(e){this._query="",this._hits=[],this.dispatchEvent(new CustomEvent("picked",{detail:{id:e.id,name:e.name},bubbles:!0,composed:!0}))}_clear(){this.dispatchEvent(new CustomEvent("picked",{detail:{id:"",name:""},bubbles:!0,composed:!0}))}render(){let e=this.ctx.t;return this.value?r`<div class="field"><span>${this.label}</span>
        <div class="row"><span class="chip">${this.valueName||this.value}</span><button class="btn text" @click=${this._clear}>${e("picker.change")}</button></div></div>`:r`<label class="field">${this.label}
      <input type="search" .value=${this._query} placeholder=${e("picker.placeholder")} autocomplete="off" @input=${i=>{this._query=i.target.value,this._search()}} />
    </label>
    ${this._hits.length?r`<div class="hits" role="listbox">${this._hits.map(i=>r`<button role="option" @click=${()=>this._pick(i)}>
          <span>${i.number!==null?`${i.number} \xB7 `:""}${i.name}</span>
          <span class="small muted" style="display:block">${k(i.path,!1)}</span></button>`)}</div>`:l}`}};customElements.define("ot-node-picker",He);var Gt=["text","multiline","number","date","bool","choice","link"],Zt=["place","furniture","container","group","item"],Ie=class extends u{static{this.properties={ctx:{attribute:!1},_draft:{state:!0},_error:{state:!0},_busy:{state:!0},_scopeNames:{state:!0}}}constructor(){super(),this._draft=null,this._error="",this._busy=!1,this._scopeNames={}}static{this.styles=[p]}willUpdate(){for(let t of this.ctx?.catalog?.fields??[]){let e=t.scope.node;e&&!(e in this._scopeNames)&&(this._scopeNames={...this._scopeNames,[e]:"\u2026"},this.ctx.api.node(e).then(i=>this._scopeNames={...this._scopeNames,[e]:"name"in i?i.name:e}).catch(()=>this._scopeNames={...this._scopeNames,[e]:e}))}}_edit(t){this._error="",this._draft=t?{id:t.id,name:t.name,type:t.type,group:t.group??"",scopeNode:t.scope.node??"",scopeName:t.scope.node?this._scopeNames[t.scope.node]??"":"",kinds:[...t.kinds??[]],classes:[...t.classes??[]],unit:t.unit??"",options:(t.options??[]).join(`
`),remind:t.remind_days_before!==void 0?String(t.remind_days_before):"",builtin:!!t.builtin}:{id:null,name:"",type:"text",group:"",scopeNode:"",scopeName:"",kinds:[],classes:[],unit:"",options:"",remind:"",builtin:!1}}async _save(){let t=this._draft;if(!t)return;let e=this.ctx.t;if(!t.name.trim()){this._error=e("form.nameRequired");return}let i=t.remind.trim()===""?null:Number.parseInt(t.remind,10);if(i!==null&&!(i>=0)){this._error=e("fields.remindInvalid");return}this._busy=!0;try{let s=S(t.options);t.id?await this.ctx.api.fieldDefUpdate(t.id,{name:t.name,group:t.group,kinds:t.kinds,classes:t.classes,...t.type==="number"?{unit:t.unit}:{},...t.type==="choice"?{options:s}:{},...t.type==="date"?{remind_days_before:i}:{}}):await this.ctx.api.fieldDefAdd({name:t.name,field_type:t.type,...t.group?{group:t.group}:{},...t.scopeNode?{scope_node:t.scopeNode}:{},...t.kinds.length?{kinds:t.kinds}:{},...t.classes.length?{classes:t.classes}:{},...t.type==="number"&&t.unit?{unit:t.unit}:{},...t.type==="choice"?{options:s}:{},...t.type==="date"&&i!==null?{remind_days_before:i}:{}}),this._draft=null,await this.ctx.reloadCatalog(),this.ctx.toast(e("form.saved"))}catch(s){this._error=h(s)}finally{this._busy=!1}}async _delete(){let t=this._draft;if(!t?.id)return;let e=this.ctx.t;if(await this.ctx.confirm({title:e("fields.deleteTitle",{name:t.name}),message:e("fields.deleteMessage"),confirmLabel:e("common.delete"),danger:!0}))try{await this.ctx.api.fieldDefDelete(t.id),this._draft=null,await this.ctx.reloadCatalog(),this.ctx.toast(e("fields.deleted"))}catch(s){this._error=h(s)}}async _toggleHidden(t){try{await this.ctx.api.fieldDefUpdate(t.id,{hidden:!t.hidden}),await this.ctx.reloadCatalog()}catch(e){this.ctx.toast(h(e),"error")}}_toggle(t,e){return t.includes(e)?t.filter(i=>i!==e):[...t,e]}render(){let t=this.ctx.t,e=this.ctx.catalog?.fields??[],i=[...new Set(e.map(s=>s.group??""))];return r`
      <p class="muted small" style="margin:0 4px 10px">${t("fields.help")}</p>
      ${i.map(s=>r`
        <div class="section-title">${s||t("form.fieldsOther")}</div>
        <div class="list">${e.filter(n=>(n.group??"")===s).map(n=>this._row(n))}</div>`)}
      ${e.length===0?r`<div class="empty small">${t("fields.none")}</div>`:l}
      <div style="margin-top:12px"><button class="btn primary" @click=${()=>this._edit(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("fields.new")}</button></div>
      ${this._dialog()}
    `}_row(t){let e=this.ctx.t,i=t.scope.node?e("fields.scopeLocal",{name:this._scopeNames[t.scope.node]??"\u2026"}):e("fields.scopeGlobal"),s=[e(`fields.type.${t.type}`),i,t.remind_days_before!==void 0?e("fields.remindShort",{n:t.remind_days_before}):""].filter(Boolean).join(" \xB7 ");return r`<div class="rowbox" style="display:flex;align-items:center;border-bottom:1px solid var(--divider-color);${t.hidden?"opacity:.6":""}">
      <button class="item" style="border:none;flex:1;min-width:0;width:auto" @click=${()=>this._edit(t)}>
        <span class="grow"><span class="title">${t.name}</span>
          <span class="small muted" style="display:block">${s}</span></span>
        ${t.builtin?r`<span class="chip">${e("fields.builtin")}</span>`:l}
      </button>
      <button class="btn text" aria-pressed=${t.hidden?"true":"false"} aria-label=${`${t.hidden?e("fields.show"):e("fields.hide")}: ${t.name}`} @click=${()=>this._toggleHidden(t)}>
        <ha-icon icon=${t.hidden?"mdi:eye-off-outline":"mdi:eye-outline"}></ha-icon>${t.hidden?e("fields.show"):e("fields.hide")}</button>
    </div>`}_dialog(){let t=this._draft;if(!t)return l;let e=this.ctx.t,i=n=>this._draft={...t,...n},s=this.ctx.catalog?.kinds??[];return r`<ot-dialog .heading=${t.id?e("fields.edit"):e("fields.new")} .closeLabel=${e("common.close")} @close=${()=>this._draft=null}>
      <div class="stack">
        <label class="field">${e("form.name")} *<input .value=${t.name} @input=${n=>i({name:n.target.value})} /></label>
        <label class="field">${e("fields.typeLabel")}
          <select .value=${t.type} ?disabled=${!!t.id} @change=${n=>i({type:n.target.value})}>
            ${Gt.map(n=>r`<option value=${n} ?selected=${n===t.type}>${e(`fields.type.${n}`)}</option>`)}
          </select></label>
        <label class="field">${e("fields.group")}<input .value=${t.group} placeholder=${e("fields.groupPlaceholder")} @input=${n=>i({group:n.target.value})} /></label>
        ${t.type==="number"?r`<label class="field">${e("fields.unit")}<input .value=${t.unit} @input=${n=>i({unit:n.target.value})} /></label>`:l}
        ${t.type==="choice"?r`<label class="field">${e("fields.options")}<textarea rows="3" .value=${t.options} @input=${n=>i({options:n.target.value})}></textarea><span class="small muted">${e("fields.optionsHelp")}</span></label>`:l}
        ${t.type==="date"?r`<label class="field">${e("fields.remind")}<input type="number" inputmode="numeric" min="0" .value=${t.remind} placeholder=${e("fields.remindNone")} @input=${n=>i({remind:n.target.value})} /><span class="small muted">${e("fields.remindHelp")}</span></label>`:l}
        ${t.id?r`<div class="small muted">${t.scopeNode?e("fields.scopeLocal",{name:t.scopeName||this._scopeNames[t.scopeNode]||t.scopeNode}):e("fields.scopeGlobal")} · ${e("fields.scopeFixed")}</div>`:r`<ot-node-picker .ctx=${this.ctx} .label=${e("fields.scopeLabel")} .value=${t.scopeNode} .valueName=${t.scopeName} @picked=${n=>i({scopeNode:n.detail.id,scopeName:n.detail.name})}></ot-node-picker>
            ${t.scopeNode?l:r`<div class="small muted">${e("fields.scopeHelp")}</div>`}`}
        <details>
          <summary style="min-height:44px;display:flex;align-items:center;color:var(--primary-color)">${e("fields.restrict")}</summary>
          <div class="stack" style="margin-top:8px">
            <div class="small muted">${e("fields.restrictHelp")}</div>
            <div class="row wrap">${Zt.map(n=>r`<button class="chip" aria-pressed=${t.classes.includes(n)?"true":"false"} @click=${()=>i({classes:this._toggle(t.classes,n)})}>${e(`class.${n}`)}</button>`)}</div>
            <div class="row wrap">${s.map(n=>r`<button class="chip" aria-pressed=${t.kinds.includes(n.id)?"true":"false"} @click=${()=>i({kinds:this._toggle(t.kinds,n.id)})}>${n.name}</button>`)}</div>
          </div>
        </details>
        ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
      </div>
      ${t.id&&!t.builtin?r`<button slot="footer" class="btn danger" @click=${this._delete}>${e("common.delete")}</button><span slot="footer" class="grow"></span>`:l}
      <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._save}>${e("common.save")}</button>
    </ot-dialog>`}};customElements.define("ot-settings-fields",Ie);var _t=["lent_days","stale_days","trash_days"],Oe=class extends u{static{this.properties={ctx:{attribute:!1},_values:{state:!0},_error:{state:!0},_busy:{state:!0}}}constructor(){super(),this._values=null,this._error="",this._busy=!1}static{this.styles=[p]}get _current(){let t=this.ctx.catalog?.settings;return this._values??{lent_days:String(t?.lent_days??30),stale_days:String(t?.stale_days??365),trash_days:String(t?.trash_days??30)}}async _save(){let t=this.ctx.t,e={};for(let i of _t){let s=Number.parseInt(this._current[i],10);if(!(s>=1)){this._error=t("reminders.invalid");return}e[i]=s}this._busy=!0,this._error="";try{await this.ctx.api.settings(e),this._values=null,await this.ctx.reloadCatalog(),this.ctx.toast(t("form.saved"))}catch(i){this._error=h(i)}finally{this._busy=!1}}async _transfer(){let t=this.ctx.t;try{let e=await this.ctx.api.todoTransfer();this.ctx.toast(t("restock.transferred",{added:e.added,skipped:e.skipped}))}catch(e){this.ctx.toast(h(e),"error")}}render(){let t=this.ctx.t,e=this._current,i=this.ctx.status,s=n=>r`<label class="field">${t(`reminders.${n}`)}
      <input type="number" inputmode="numeric" min="1" .value=${e[n]} @input=${o=>this._values={...e,[n]:o.target.value}} />
      <span class="small muted">${t(`reminders.${n}Help`)}</span></label>`;return r`
      <div class="stack">
        <div class="card stack">
          <h2>${t("reminders.title")}</h2>
          ${_t.map(s)}
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
          <div><button class="btn primary" ?disabled=${this._busy||this._values===null} @click=${this._save}>${t("common.save")}</button></div>
        </div>
        <div class="card stack">
          <h2>${t("restock.todoTitle")}</h2>
          <p class="small muted" style="margin:0">${i?.todo_entity?t(i.todo_auto?"restock.todoAuto":"restock.todoManual",{entity:i.todo_entity}):t("restock.noTodo")}</p>
          <p class="small muted" style="margin:0">${t("restock.todoWhere")}</p>
          ${i?.todo_entity?r`<div><button class="btn" @click=${this._transfer}><ha-icon icon="mdi:cart-arrow-right"></ha-icon>${t("restock.toTodo")}</button></div>`:l}
        </div>
      </div>
    `}};customElements.define("ot-settings-reminders",Oe);var ze=class extends u{static{this.properties={ctx:{attribute:!1},_index:{state:!0},_text:{state:!0},_error:{state:!0}}}constructor(){super(),this._index=null,this._text="",this._error=""}static{this.styles=[p]}get _groups(){return this.ctx.catalog?.synonyms??[]}_edit(t){this._error="",this._index=t,this._text=t>=0?this._groups[t].join(", "):""}async _store(t,e){try{return await this.ctx.api.synonyms(t),await this.ctx.reloadCatalog(),this.ctx.toast(e),!0}catch(i){return this._error=h(i),!1}}async _save(){let t=S(this._text);if(t.length<2){this._error=this.ctx.t("synonyms.atLeastTwo");return}let e=this._groups.map(i=>[...i]);this._index!==null&&this._index>=0?e[this._index]=t:e.push(t),await this._store(e,this.ctx.t("form.saved"))&&(this._index=null)}async _delete(){if(this._index===null||this._index<0)return;let t=this._groups.filter((e,i)=>i!==this._index);await this._store(t,this.ctx.t("synonyms.deleted"))&&(this._index=null)}render(){let t=this.ctx.t,e=this._groups;return r`
      <p class="muted small" style="margin:0 4px 10px">${t("synonyms.help")}</p>
      ${e.length?r`<div class="list">${e.map((i,s)=>r`<button class="item" style="width:100%" @click=${()=>this._edit(s)}>
            <ha-icon class="icon" icon="mdi:equal"></ha-icon><span class="grow">${i.join(" = ")}</span><ha-icon class="icon" icon="mdi:pencil"></ha-icon></button>`)}</div>`:r`<div class="empty small">${t("synonyms.none")}</div>`}
      <div style="margin-top:12px"><button class="btn primary" @click=${()=>this._edit(-1)}><ha-icon icon="mdi:plus"></ha-icon>${t("synonyms.new")}</button></div>
      ${this._index!==null?r`<ot-dialog .heading=${this._index>=0?t("synonyms.edit"):t("synonyms.new")} .closeLabel=${t("common.close")} @close=${()=>this._index=null}>
            <label class="field">${t("synonyms.terms")}
              <textarea rows="3" .value=${this._text} placeholder="Tacker, Hefter, Klammermaschine" @input=${i=>this._text=i.target.value}></textarea>
              <span class="small muted">${t("synonyms.termsHelp")}</span></label>
            ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
            ${this._index>=0?r`<button slot="footer" class="btn danger" @click=${this._delete}>${t("common.delete")}</button><span slot="footer" class="grow"></span>`:l}
            <button slot="footer" class="btn primary" @click=${this._save}>${t("common.save")}</button>
          </ot-dialog>`:l}
    `}};customElements.define("ot-settings-synonyms",ze);var Qt=["place","furniture","container","group","item"],yt=["kinds","persons","fields","synonyms","reminders","data"],Be=class extends u{static{this.properties={ctx:{attribute:!1},section:{type:String},_kind:{state:!0},_person:{state:!0},_error:{state:!0},_busy:{state:!0},_importText:{state:!0}}}constructor(){super(),this.section="kinds",this._kind=null,this._person=null,this._error="",this._busy=!1,this._importText=null}static{this.styles=[p,v`
      .tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 8px 0 16px;
      }
      .entry {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 8px 12px;
        width: 100%;
        border: none;
        border-bottom: 1px solid var(--divider-color);
        background: transparent;
        text-align: left;
      }
      .entry:last-child {
        border-bottom: none;
      }
      .block {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `]}get _section(){return yt.includes(this.section)?this.section:"kinds"}_editKind(t){this._error="",this._kind=t?{id:t.id,name:t.name,class:t.class,icon:t.icon,numbered:t.numbered,replacement:"",needsReplacement:!1}:{id:null,name:"",class:"container",icon:"",numbered:!1,replacement:"",needsReplacement:!1}}async _saveKind(){let t=this._kind;if(t){if(!t.name.trim()){this._error=this.ctx.t("form.nameRequired");return}this._busy=!0;try{t.id?await this.ctx.api.kindUpdate(t.id,{name:t.name,class:t.class,icon:t.icon,numbered:t.numbered}):await this.ctx.api.kindAdd({name:t.name,class:t.class,icon:t.icon,numbered:t.numbered}),this._kind=null,await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("form.saved"))}catch(e){this._error=h(e)}finally{this._busy=!1}}}async _deleteKind(){let t=this._kind;if(t?.id){this._busy=!0;try{await this.ctx.api.kindDelete(t.id,t.needsReplacement?t.replacement:void 0),this._kind=null,await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("settings.kindDeleted"))}catch(e){if(e instanceof M&&e.code==="in_use"&&!t.needsReplacement){let i=this.ctx.catalog?.kinds.find(s=>s.id!==t.id);this._kind={...t,needsReplacement:!0,replacement:i?.id??""},this._error=e.message}else this._error=h(e)}finally{this._busy=!1}}}_kindDialog(){let t=this.ctx.t,e=this._kind;if(!e)return l;let i=s=>this._kind={...e,...s};return r`
      <ot-dialog .heading=${e.id?t("settings.kindEdit"):t("settings.kindNew")} .closeLabel=${t("common.close")} @close=${()=>this._kind=null}>
        <div class="block">
          <label class="field">${t("form.name")} *<input .value=${e.name} @input=${s=>i({name:s.target.value})} /></label>
          <label class="field">${t("settings.class")}
            <select .value=${e.class} @change=${s=>i({class:s.target.value})}>
              ${Qt.map(s=>r`<option value=${s} ?selected=${e.class===s}>${t(`class.${s}`)} – ${t(`classHelp.${s}`)}</option>`)}
            </select></label>
          <label class="field">${t("settings.icon")}<input .value=${e.icon} placeholder="mdi:package-variant" @input=${s=>i({icon:s.target.value})} /></label>
          <label class="check"><input type="checkbox" .checked=${e.numbered} @change=${s=>i({numbered:s.target.checked})} />${t("settings.numbered")}</label>
          ${e.needsReplacement?r`<label class="field">${t("settings.replacement")}
                <select .value=${e.replacement} @change=${s=>i({replacement:s.target.value})}>
                  ${(this.ctx.catalog?.kinds??[]).filter(s=>s.id!==e.id).map(s=>r`<option value=${s.id} ?selected=${s.id===e.replacement}>${s.name}</option>`)}
                </select></label>`:l}
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </div>
        ${e.id?r`<button slot="footer" class="btn danger" ?disabled=${this._busy} @click=${this._deleteKind}>${e.needsReplacement?t("settings.replaceDelete"):t("common.delete")}</button>`:l}
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._saveKind}>${t("common.save")}</button>
      </ot-dialog>
    `}_editPerson(t){this._error="",this._person={id:t?.id??null,name:t?.name??"",ha:t?.ha_person??""}}async _savePerson(){let t=this._person;if(t){if(!t.name.trim()){this._error=this.ctx.t("form.nameRequired");return}this._busy=!0;try{t.id?await this.ctx.api.personUpdate(t.id,{name:t.name,ha_person:t.ha||null}):await this.ctx.api.personAdd(t.name,t.ha||null),this._person=null,await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("form.saved"))}catch(e){this._error=h(e)}finally{this._busy=!1}}}async _deletePerson(){let t=this._person;if(!t?.id)return;let e=this.ctx.t;if(await this.ctx.confirm({title:e("settings.personDeleteTitle",{name:t.name}),message:e("settings.personDeleteMessage"),confirmLabel:e("common.delete"),danger:!0}))try{let s=await this.ctx.api.personDelete(t.id);this._person=null,await this.ctx.reloadCatalog(),this.ctx.toast(e("settings.personDeleted",{n:s.cleared}))}catch(s){this._error=h(s)}}_personDialog(){let t=this.ctx.t,e=this._person;if(!e)return l;let i=n=>this._person={...e,...n},s=Object.keys(this.ctx.hass.states).filter(n=>n.startsWith("person."));return r`
      <ot-dialog .heading=${e.id?t("settings.personEdit"):t("settings.personNew")} .closeLabel=${t("common.close")} @close=${()=>this._person=null}>
        <div class="block">
          <label class="field">${t("form.name")} *<input .value=${e.name} @input=${n=>i({name:n.target.value})} /></label>
          <label class="field">${t("settings.haPerson")}
            <select .value=${e.ha} @change=${n=>i({ha:n.target.value})}>
              <option value="" ?selected=${e.ha===""}>${t("settings.noHaPerson")}</option>
              ${s.map(n=>r`<option value=${n} ?selected=${n===e.ha}>${this.ctx.hass.states[n].attributes.friendly_name??n}</option>`)}
            </select></label>
          ${this._error?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </div>
        ${e.id?r`<button slot="footer" class="btn danger" @click=${this._deletePerson}>${t("common.delete")}</button>`:l}
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._savePerson}>${t("common.save")}</button>
      </ot-dialog>
    `}async _export(t){try{let e=await this.ctx.api.exportData(t);mt(e.filename,e.text,t==="json"?"application/json":"text/markdown"),this.ctx.toast(this.ctx.t("data.exported",{name:e.filename}))}catch(e){this.ctx.toast(h(e),"error")}}async _copy(){try{let t=await this.ctx.api.exportData("json");await navigator.clipboard.writeText(t.text),this.ctx.toast(this.ctx.t("data.copied"))}catch(t){this.ctx.toast(h(t),"error")}}async _pickFile(t){let e=t.target,i=e.files?.[0];e.value="",i&&(this._importText=await i.text(),this._error="")}async _import(){if(this._importText===null)return;let t=this.ctx.t;if(await this.ctx.confirm({title:t("data.importTitle"),message:t("data.importMessage"),confirmLabel:t("data.import"),danger:!0})){this._busy=!0;try{let i=await this.ctx.api.importText(this._importText);this._importText=null,await this.ctx.reloadCatalog(),this.ctx.toast(t("data.imported",{n:i.nodes}))}catch(i){this._error=h(i)}finally{this._busy=!1}}}_data(){let t=this.ctx.t,e=this.ctx.status;return r`
      <div class="stack">
        <div class="card block">
          <h2>${t("data.export")}</h2>
          <p class="muted small" style="margin:0">${t("data.exportHelp")}</p>
          <div class="row wrap">
            <button class="btn" @click=${()=>this._export("json")}><ha-icon icon="mdi:download"></ha-icon>inventar.json</button>
            <button class="btn" @click=${()=>this._export("markdown")}><ha-icon icon="mdi:language-markdown-outline"></ha-icon>${t("data.markdown")}</button>
            <button class="btn text" @click=${this._copy}><ha-icon icon="mdi:content-copy"></ha-icon>${t("data.copy")}</button>
          </div>
        </div>
        <div class="card block">
          <h2>${t("data.import")}</h2>
          <p class="muted small" style="margin:0">${t("data.importHelp")}</p>
          <input type="file" accept="application/json,.json" aria-label=${t("data.import")} @change=${this._pickFile} />
          ${this._importText!==null?r`<div class="row wrap"><span class="grow small">${t("data.ready",{kb:Math.max(1,Math.round(this._importText.length/1024))})}</span>
                <button class="btn danger" ?disabled=${this._busy} @click=${this._import}>${t("data.import")}</button></div>`:l}
          ${this._error&&!this._kind&&!this._person?r`<div class="error-text" role="alert">${this._error}</div>`:l}
        </div>
        <div class="card block">
          <h2>${t("sample.title")}</h2>
          ${this.ctx.catalog?.sample_loaded?r`<p class="muted small" style="margin:0">${t("sample.active")}</p><div><button class="btn danger" @click=${this._removeSample}>${t("sample.remove")}</button></div>`:r`<p class="muted small" style="margin:0">${e?.inventory_empty?t("sample.help"):t("sample.onlyEmpty")}</p>
                <div><button class="btn" ?disabled=${!e?.inventory_empty} @click=${this._loadSample}>${t("sample.load")}</button></div>`}
        </div>
        <div class="muted small" style="margin:8px 4px">${t("settings.about",{version:"0.5.0",nodes:e?.nodes??0})}</div>
      </div>
    `}async _loadSample(){try{await this.ctx.api.sampleLoad(),await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("sample.loaded"))}catch(t){this.ctx.toast(h(t),"error")}}async _removeSample(){let t=this.ctx.t;if(await this.ctx.confirm({title:t("sample.removeTitle"),message:t("sample.removeMessage"),confirmLabel:t("sample.remove"),danger:!0}))try{await this.ctx.api.sampleRemove(),await this.ctx.reloadCatalog(),this.ctx.toast(t("sample.removed"))}catch(i){this.ctx.toast(h(i),"error")}}render(){let t=this.ctx.t,e=this._section,i=this.ctx.catalog;return r`
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0">${t("nav.settings")}</h1>
      <div class="tabs" role="tablist">
        ${yt.map(s=>r`<button class="chip" role="tab" aria-selected=${e===s?"true":"false"} aria-pressed=${e===s?"true":"false"} @click=${()=>this.ctx.go({page:"settings",section:s},{replace:!0})}>${t(`settings.tab.${s}`)}</button>`)}
      </div>
      ${e==="kinds"?r`<p class="muted small" style="margin:0 4px 10px">${t("settings.kindsHelp")}</p>
            <div class="list">
              ${(i?.kinds??[]).map(s=>r`<button class="entry" @click=${()=>this._editKind(s)}>
                <ha-icon class="muted" icon=${y(s)}></ha-icon>
                <span class="grow"><span>${s.name}</span><span class="small muted" style="display:block">${t(`class.${s.class}`)}${s.numbered?` \xB7 ${t("settings.numberedShort")}`:""}</span></span>
                <ha-icon class="muted" icon="mdi:pencil"></ha-icon></button>`)}
            </div>
            <div style="margin-top:12px"><button class="btn primary" @click=${()=>this._editKind(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("settings.kindNew")}</button></div>`:l}
      ${e==="persons"?r`<p class="muted small" style="margin:0 4px 10px">${t("settings.personsHelp")}</p>
            ${(i?.persons??[]).length?r`<div class="list">${i.persons.map(s=>r`<button class="entry" @click=${()=>this._editPerson(s)}>
                  <ha-icon class="muted" icon="mdi:account"></ha-icon>
                  <span class="grow"><span>${s.name}</span>${s.ha_person?r`<span class="small muted" style="display:block">${this.ctx.hass.states[s.ha_person]?.attributes.friendly_name??s.ha_person}</span>`:l}</span>
                  <ha-icon class="muted" icon="mdi:pencil"></ha-icon></button>`)}</div>`:r`<div class="empty small">${t("settings.noPersons")}</div>`}
            <div style="margin-top:12px"><button class="btn primary" @click=${()=>this._editPerson(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("settings.personNew")}</button></div>`:l}
      ${e==="fields"?r`<ot-settings-fields .ctx=${this.ctx}></ot-settings-fields>`:l}
      ${e==="synonyms"?r`<ot-settings-synonyms .ctx=${this.ctx}></ot-settings-synonyms>`:l}
      ${e==="reminders"?r`<ot-settings-reminders .ctx=${this.ctx}></ot-settings-reminders>`:l}
      ${e==="data"?this._data():l}
      ${this._kindDialog()} ${this._personDialog()}
    `}};customElements.define("ot-settings-page",Be);var Ue=class extends u{constructor(){super();this._revision=-1;this.currentId="",this._children={},this._open=new Set(["_root"])}static{this.properties={ctx:{attribute:!1},currentId:{type:String},_children:{state:!0},_open:{state:!0}}}static{this.styles=[p,v`
      ul {
        list-style: none;
        margin: 0;
        padding-left: 14px;
      }
      ul.root {
        padding-left: 0;
      }
      .node {
        display: flex;
        align-items: center;
        gap: 2px;
        min-height: 36px;
      }
      .node .toggle {
        width: 28px;
        height: 36px;
        border: none;
        background: transparent;
        flex: none;
        --mdc-icon-size: 20px;
      }
      .node .name {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: transparent;
        text-align: left;
        min-height: 36px;
        padding: 0 6px;
        border-radius: 6px;
        --mdc-icon-size: 20px;
      }
      .node .name:hover {
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
      }
      .node .name.current {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
        font-weight: 500;
      }
      .spacer {
        width: 28px;
        flex: none;
      }
    `]}willUpdate(){let e=this.ctx?.revision??0;e!==this._revision&&(this._revision=e,this._reloadOpen())}async _reloadOpen(){for(let e of this._open)await this._load(e)}async _load(e){try{let s=(await this.ctx.api.node(e==="_root"?null:e)).contents.filter(n=>n.class!=="item"&&n.id!=="papierkorb");this._children={...this._children,[e]:s}}catch{}}async _toggle(e){let i=new Set(this._open);i.has(e)?i.delete(e):(i.add(e),this._children[e]||await this._load(e)),this._open=i}_branch(e,i=!1){let s=this._children[e];return s?r`<ul class=${i?"root":""} role=${i?"tree":"group"}>
      ${s.map(n=>{let o=this._open.has(n.id),d=n.children>0;return r`<li role="treeitem" aria-expanded=${d?String(o):l}>
          <div class="node">
            ${d?r`<button class="toggle" aria-label=${o?this.ctx.t("tree.collapse",{name:n.name}):this.ctx.t("tree.expand",{name:n.name})} @click=${()=>this._toggle(n.id)}><ha-icon icon=${o?"mdi:chevron-down":"mdi:chevron-right"}></ha-icon></button>`:r`<span class="spacer"></span>`}
            <button class="name ${n.id===this.currentId?"current":""}" aria-current=${n.id===this.currentId?"page":l} @click=${()=>this.ctx.go({page:"node",id:n.id})}>
              <ha-icon icon=${y(n)}></ha-icon>
              ${n.number!==null?r`<span class="badge">${n.number}</span>`:l}
              <span class="ellipsis">${n.name}</span>
            </button>
          </div>
          ${o?this._branch(n.id):l}
        </li>`})}
    </ul>`:l}render(){return this._children._root||this._load("_root"),r`<nav aria-label=${this.ctx.t("tree.label")}>${this._branch("_root",!0)}</nav>`}};customElements.define("ot-tree",Ue);var Ke={"app.title":"Ordnung","common.cancel":"Abbrechen","common.close":"Schlie\xDFen","common.delete":"L\xF6schen","common.edit":"Bearbeiten","common.loading":"Lade \u2026","common.move":"Verschieben","common.no":"Nein","common.save":"Speichern","common.start":"Start","common.yes":"Ja","nav.back":"Zur\xFCck","nav.browse":"St\xF6bern","nav.due":"F\xE4llig","nav.main":"Hauptnavigation","nav.menu":"Seitenleiste \xF6ffnen","nav.overview":"\xDCbersicht","nav.settings":"Einstellungen","nav.trash":"Papierkorb","class.place":"R\xE4ume","class.furniture":"M\xF6bel","class.container":"Beh\xE4lter","class.group":"Gruppen","class.item":"Dinge","classHelp.place":"Ort, an dem etwas steht","classHelp.furniture":"M\xF6bel oder Ablage","classHelp.container":"beweglicher Beh\xE4lter","classHelp.group":"Sammelbezeichnung f\xFCr Inhalt","classHelp.item":"einzelnes Ding","condition.ok":"in Ordnung","condition.missing":"vermisst","condition.defective":"defekt","condition.to_sell":"zu verkaufen","condition.to_give_away":"zu verschenken","condition.disposed":"entsorgt / weggegeben","overview.welcome":"Willkommen im Ordnungs-Tracker","overview.welcomeText":"Lege zuerst einen Raum an (z. B. \u201EKeller\u201C), darin ein Regal und Kisten mit Nummern \u2013 und schreibe hinein, was darin liegt. Grob anfangen reicht: Verfeinern kannst du sp\xE4ter.","overview.start":"Loslegen","overview.containers":"Beh\xE4lter","overview.items":"Dinge","overview.unsorted":"Unsortiert","overview.checkedOut":"Entnommen","overview.due":"F\xE4llig","overview.restock":"Nachkaufen","overview.nextNumber":"N\xE4chste freie Nummer: {n}","overview.value":"Gesamtwert: {value}","overview.favorites":"Favoriten","overview.favoritesEmpty":"Tippe bei einem Eintrag auf den Stern, dann erscheint er hier.","overview.recent":"Zuletzt angesehen","overview.recentEmpty":"Hier stehen die Eintr\xE4ge, die du zuletzt ge\xF6ffnet hast.","overview.emptyContainers":"Leere Beh\xE4lter","node.rootTitle":"Alle Orte","node.new":"Neu","node.quick":"Schnellerfassung","node.selectAll":"Alle ausw\xE4hlen","node.contents":"Inhalt","node.selected":"{n} ausgew\xE4hlt","node.selection":"Auswahl","node.favorite":"Zu Favoriten hinzuf\xFCgen","node.unfavorite":"Aus Favoriten entfernen","node.more":"Weitere Aktionen","node.kind":"Art","node.owner":"Besitzer","node.inherited":"geerbt","node.quantity":"Menge","node.minimum":"Mindestbestand","node.aliases":"Auch bekannt als","node.tags":"Schlagw\xF6rter","node.note":"Notiz","node.condition":"Zustand","node.lentTo":"Ausgeliehen an","node.outAt":"Entnommen, jetzt","node.since":"seit","node.until":"bis","node.viaContainer":"\xFCber den Beh\xE4lter","node.unassigned":"nicht mehr zugeordnet","node.emptyRoot":"Noch nichts da. Tippe auf \u201ENeu\u201C und lege einen Raum an, zum Beispiel \u201EKeller\u201C.","node.emptyPlace":"In diesem Raum liegt noch nichts. Lege ein Regal oder eine Kiste an \u2013 oder nutze die Schnellerfassung.","node.emptyContainer":"Diese Kiste ist leer. Tippe auf \u201ESchnellerfassung\u201C und schreibe auf, was hineinkommt \u2013 eine Zeile pro Ding.","node.emptyItem":"Hier ist nichts abgelegt. Wenn du etwas hineinlegst, wird aus dem Ding automatisch eine Gruppe.","node.emptyGeneric":"Hier ist noch nichts. Tippe auf \u201ENeu\u201C oder nutze die Schnellerfassung.","node.emptyTrashed":"Dieser Eintrag liegt im Papierkorb.","form.createTitle":"Neuer Eintrag","form.editTitle":"Eintrag bearbeiten","form.name":"Name","form.nameRequired":"Bitte gib einen Namen an.","form.kind":"Art","form.number":"Nummer","form.numberNone":"keine","form.numberInvalid":"Nummer, Menge und Mindestbestand m\xFCssen Zahlen sein (Nummer: ganze Zahl ab 1).","form.more":"Weitere Angaben","form.aliases":"Auch bekannt als (mit Komma trennen)","form.tags":"Schlagw\xF6rter (mit Komma trennen)","form.owner":"Besitzer","form.ownerNone":"\u2013 keiner \u2013","form.ownerInherited":"\u2013 geerbt von {name} \u2013","form.quantity":"Menge","form.unit":"Einheit","form.minQuantity":"Mindestbestand","form.note":"Notiz","form.created":"\u201E{name}\u201C angelegt","form.saved":"Gespeichert","quick.title":"Schnellerfassung in \u201E{name}\u201C","quick.placeholder":`Schere
3x Batterien AA
2 Rollen Klebeband
Bastelsachen
  Buntpapier
  Kleber`,"quick.commas":"Kommas trennen Eintr\xE4ge (praktisch beim Diktieren)","quick.help":"Eine Zeile pro Ding. Eine Menge davor wird erkannt (3x \u2026, 2 Rollen \u2026). Einger\xFCckte Zeilen geh\xF6ren zur Zeile dar\xFCber.","quick.preview":"Das wird angelegt ({n})","quick.apply":"{n} anlegen","quick.done":"{n} Eintr\xE4ge angelegt","move.titleOne":"Eintrag verschieben","move.titleMany":"{n} Eintr\xE4ge verschieben","move.search":"Ziel suchen oder Kistennummer eingeben","move.searchPlaceholder":"z. B. Regal oder 14","move.recent":"Zuletzt verwendet","move.browse":"St\xF6bern","move.chooseHere":"\u201E{name}\u201C w\xE4hlen","move.topLevel":"Oberste Ebene","move.nothingBelow":"Hier gibt es nichts, wohin man etwas legen k\xF6nnte.","move.open":"\u201E{name}\u201C \xF6ffnen","move.target":"Ziel: {name}","move.noTarget":"W\xE4hle ein Ziel.","move.do":"Hierher verschieben","move.done":"{n} nach \u201E{name}\u201C verschoben","delete.title":"\u201E{name}\u201C l\xF6schen?","delete.withContent":"Darin liegen {n} Unterpunkte. Was soll damit geschehen?","delete.empty":"Der Eintrag wird in den Papierkorb gelegt.","delete.modeTrash":"Samt Inhalt in den Papierkorb ({n} Unterpunkte)","delete.modeLift":"Nur diesen Eintrag entfernen, der Inhalt r\xFCckt eine Ebene nach oben","delete.trashInfo":"Im Papierkorb bleibt alles {days} Tage lang wiederherstellbar.","delete.doneOne":"\u201E{name}\u201C in den Papierkorb gelegt","delete.done":"{n} Eintr\xE4ge in den Papierkorb gelegt","delete.manyTitle":"{n} Eintr\xE4ge l\xF6schen?","delete.manyMessage":"Die {n} ausgew\xE4hlten Eintr\xE4ge werden samt Inhalt in den Papierkorb gelegt und k\xF6nnen dort wiederhergestellt werden.","trash.info":"Gel\xF6schtes bleibt {days} Tage im Papierkorb und wird danach endg\xFCltig entfernt.","trash.none":"Der Papierkorb ist leer.","trash.restore":"Wiederherstellen","trash.restored":"\u201E{name}\u201C wiederhergestellt","trash.restoredUnsorted":"\u201E{name}\u201C wiederhergestellt \u2013 der alte Platz existiert nicht mehr, deshalb liegt es jetzt in \u201EUnsortiert\u201C","trash.purge":"Endg\xFCltig l\xF6schen","trash.purgeTitle":"\u201E{name}\u201C endg\xFCltig l\xF6schen?","trash.purgeMessage":"Der Eintrag und {n} Unterpunkte werden unwiderruflich entfernt. Verweise darauf aus Listen verschwinden.","trash.empty":"Papierkorb leeren","trash.emptyTitle":"Papierkorb leeren?","trash.emptyMessage":"Alles im Papierkorb wird unwiderruflich entfernt.","trash.emptied":"{n} Eintr\xE4ge endg\xFCltig entfernt","trash.withContent":"mit {n} Unterpunkten","trash.deletedOn":"gel\xF6scht am {date}","trash.bannerTop":"Dieser Eintrag liegt im Papierkorb (gel\xF6scht am {date}).","trash.bannerInside":"Dieser Eintrag geh\xF6rt zu einem gel\xF6schten Eintrag. Stelle den obersten Eintrag wieder her.","search.placeholder":"Suchen oder Nummer eingeben \u2026","search.filter":"Filter","search.moreFilters":"Weitere Filter","search.kind":"Art","search.owner":"Besitzer","search.condition":"Zustand","search.tag":"Schlagwort","search.any":"egal","search.fOut":"entnommen","search.fNumber":"mit Nummer","search.fEmpty":"ohne Inhalt","search.fStale":"lange nicht best\xE4tigt","search.fArchived":"mit Archivierten","search.within":"innerhalb eines Ortes","search.reset":"Filter zur\xFCcksetzen","search.jump":"Zu \u201E{name}\u201C springen","search.count":"{n} Treffer","search.countMore":"{n} Treffer, die ersten {shown} werden gezeigt","search.none":"Nichts gefunden. Pr\xFCfe die Schreibweise oder lockere die Filter.","search.results":"Suchergebnisse","due.title":"F\xE4llig","due.none":"Nichts f\xE4llig. Alles in Ordnung.","due.overdue":"\xFCberf\xE4llig","due.expiring":"L\xE4uft bald ab oder ist abgelaufen","due.checkout_overdue":"R\xFCckgabe \xFCberf\xE4llig","due.below_min":"Unter Mindestbestand","due.maintenance_due":"Wartung f\xE4llig","due.missing":"Vermisst","sample.title":"Beispieldaten","sample.load":"Beispieldaten laden","sample.help":"L\xE4dt einen kleinen Beispielhaushalt (etwa 60 Eintr\xE4ge) zum Ausprobieren. Du kannst ihn jederzeit wieder entfernen.","sample.onlyEmpty":"Beispieldaten lassen sich nur in ein leeres Inventar laden.","sample.active":"Die Beispieldaten sind geladen.","sample.loaded":"Beispieldaten geladen","sample.remove":"Beispieldaten entfernen","sample.removeTitle":"Beispieldaten entfernen?","sample.removeMessage":"Alle Beispieleintr\xE4ge werden gel\xF6scht. Eigene Eintr\xE4ge, die du in Beispiel-Kisten gelegt hast, wandern nach \u201EUnsortiert\u201C.","sample.removed":"Beispieldaten entfernt","settings.tab.kinds":"Arten","settings.tab.persons":"Personen","settings.tab.data":"Daten","settings.kindsHelp":"Eine Art legt fest, was ein Eintrag ist (Raum, Regal, Kiste \u2026). Eigene Arten \u2013 etwa \u201ESchublade\u201C oder \u201EKoffer\u201C \u2013 geh\xF6ren immer zu einer von f\xFCnf Klassen.","settings.kindNew":"Neue Art","settings.kindEdit":"Art bearbeiten","settings.kindDeleted":"Art gel\xF6scht","settings.class":"Klasse","settings.icon":"Symbol (z. B. mdi:package-variant)","settings.numbered":"Eintr\xE4ge dieser Art bekommen \xFCblicherweise eine Nummer","settings.numberedShort":"nummeriert","settings.replacement":"Diese Art wird noch verwendet. Auf welche Art sollen die Eintr\xE4ge umgestellt werden?","settings.replaceDelete":"Umstellen und l\xF6schen","settings.personsHelp":"Personen k\xF6nnen Besitzer von Eintr\xE4gen sein. Der Besitz vererbt sich nach unten: Geh\xF6rt die Werkstatt Papa, geh\xF6rt alles darin Papa \u2013 au\xDFer, weiter unten steht etwas anderes.","settings.noPersons":"Noch keine Personen angelegt.","settings.personNew":"Neue Person","settings.personEdit":"Person bearbeiten","settings.personDeleteTitle":"\u201E{name}\u201C l\xF6schen?","settings.personDeleteMessage":"Die Zuordnung zu Eintr\xE4gen entf\xE4llt. Die Eintr\xE4ge selbst bleiben bestehen.","settings.personDeleted":"Person gel\xF6scht ({n} Zuordnungen entfernt)","settings.haPerson":"Mit Person aus Home Assistant verkn\xFCpfen","settings.noHaPerson":"\u2013 nicht verkn\xFCpft \u2013","settings.about":"Ordnungs-Tracker {version} \xB7 {nodes} Eintr\xE4ge","data.export":"Exportieren","data.exportHelp":"inventar.json enth\xE4lt alle deine Daten und l\xE4sst sich sichern oder in ein anderes System mitnehmen. Die Markdown-Liste ist zum Lesen und Ausdrucken.","data.markdown":"Lesbare Liste (Markdown)","data.copy":"In die Zwischenablage kopieren","data.copied":"inventar.json in die Zwischenablage kopiert","data.exported":"{name} gespeichert","data.import":"Importieren","data.importHelp":"Eine zuvor exportierte inventar.json ersetzt das gesamte Inventar \u2013 nach Pr\xFCfung und R\xFCckfrage. Vorher wird automatisch eine Sicherung angelegt.","data.ready":"Datei gelesen ({kb} KB)","data.importTitle":"Inventar ersetzen?","data.importMessage":"Das gesamte aktuelle Inventar wird durch die Datei ersetzt. Eine Sicherung des aktuellen Stands wird vorher angelegt.","data.imported":"Importiert ({n} Eintr\xE4ge)","card.title":"Titel (freiwillig)","card.mode":"Betriebsart","card.modeSearch":"Nur Suche","card.modeTiles":"Suche mit Kacheln","card.modeNode":"Inhalt eines Eintrags","card.node":"Eintrag (Kennung oder Nummer)","card.nodeHelp":"Z. B. die Nummer einer Kiste: 14.","tree.label":"Orte","tree.expand":"\u201E{name}\u201C aufklappen","tree.collapse":"\u201E{name}\u201C zuklappen","quantity.group":"Menge von {name}","quantity.less":"Eine Einheit weniger: {name}","quantity.more":"Eine Einheit mehr: {name}","form.fields":"Eigene Angaben","form.fieldsOther":"Sonstiges","nav.out":"Entnommen","nav.restock":"Nachkaufen","checkout.lend":"Ausleihen an \u2026","checkout.takeOut":"Entnehmen / auslagern","checkout.return":"Zur\xFCcklegen","checkout.titleLent":"\u201E{name}\u201C ausleihen","checkout.titleOut":"\u201E{name}\u201C entnehmen","checkout.toLent":"Ausgeliehen an","checkout.toOut":"Wo ist es jetzt?","checkout.placeholderLent":"z. B. Nachbar Huber","checkout.placeholderOut":"z. B. h\xE4ngt am Christbaum","checkout.toRequiredLent":"Bitte nenne, an wen es ausgeliehen ist.","checkout.toRequiredOut":"Bitte nenne, wo es jetzt ist.","checkout.since":"Seit","checkout.until":"Zur\xFCck bis (wahlweise)","checkout.noReminder":"Lange Ausleihe: nicht an die R\xFCckgabe erinnern","checkout.noReminderHelp":"F\xFCr Dinge, die dauerhaft bei jemand anderem sind. Ohne R\xFCckgabedatum meldet der Ordnungs-Tracker sonst nach der eingestellten Zeit \u201E\xFCberf\xE4llig\u201C.","checkout.done":"\u201E{name}\u201C ist jetzt entnommen","checkout.returned":"\u201E{name}\u201C ist zur\xFCckgelegt","checkout.reminderOn":"Erinnerung eingeschaltet","checkout.reminderOff":"Erinnerung ausgeschaltet","checkout.reminderOnShort":"Erinnerung an","checkout.reminderOffShort":"Erinnerung aus","maintenance.section":"Wartung","maintenance.add":"Aufgabe","maintenance.none":"Keine Wartungsaufgaben.","maintenance.new":"Neue Wartungsaufgabe","maintenance.edit":"Wartungsaufgabe bearbeiten","maintenance.title":"Aufgabe","maintenance.titlePlaceholder":"z. B. Filter wechseln","maintenance.titleRequired":"Bitte gib der Aufgabe einen Namen.","maintenance.intervalInvalid":"Das Intervall muss eine ganze Zahl ab 1 sein.","maintenance.every":"Alle","maintenance.once":"einmalig","maintenance.unit":"Einheit","maintenance.unit.days":"Tage","maintenance.unit.weeks":"Wochen","maintenance.unit.months":"Monate","maintenance.unit.years":"Jahre","maintenance.nextDue":"N\xE4chste F\xE4lligkeit","maintenance.everyText":"alle {n} {unit}","maintenance.due":"f\xE4llig","maintenance.noDate":"ohne Termin","maintenance.last":"zuletzt {date}","maintenance.soon":"in {n} Tagen","maintenance.done":"Erledigt","maintenance.doneToast":"\u201E{title}\u201C erledigt","maintenance.saved":"Wartungsaufgabe gespeichert","maintenance.removed":"Wartungsaufgabe gel\xF6scht","maintenance.deleteTitle":"\u201E{title}\u201C l\xF6schen?","maintenance.deleteMessage":"Die Aufgabe samt ihrem Protokoll wird endg\xFCltig gel\xF6scht.","out.title":"Entnommen","out.none":"Alles ist an seinem Platz.","out.home":"Platz: {path}","out.days":"seit {n} Tagen weg","restock.title":"Nachkaufen","restock.none":"Nichts nachzukaufen. Alle Best\xE4nde reichen.","restock.toTodo":"Auf die To-do-Liste","restock.transferred":"{added} auf die To-do-Liste gesetzt, {skipped} standen schon darauf","restock.noTodo":"Es ist keine To-do-Liste gew\xE4hlt. Du w\xE4hlst sie unter Einstellungen \u2192 Ger\xE4te & Dienste \u2192 Ordnungs-Tracker \u2192 Konfigurieren.","restock.todoTitle":"To-do-Liste f\xFCr Nachk\xE4ufe","restock.todoAuto":"Nachk\xE4ufe landen selbstt\xE4tig auf {entity}, sobald etwas unter den Mindestbestand f\xE4llt.","restock.todoManual":"Nachk\xE4ufe lassen sich mit einem Tipp auf {entity} \xFCbertragen. Selbstt\xE4tig geht es, wenn du es in den Optionen einschaltest.","restock.todoWhere":"Die Liste und das selbstt\xE4tige \xDCbertragen stellst du unter Einstellungen \u2192 Ger\xE4te & Dienste \u2192 Ordnungs-Tracker \u2192 Konfigurieren ein.","picker.change":"\xC4ndern","picker.placeholder":"Name oder Nummer suchen \u2026","settings.tab.fields":"Felder","settings.tab.synonyms":"Synonyme","settings.tab.reminders":"Erinnerungen","fields.help":"Eigene Felder halten Angaben pro Eintrag fest, etwa Ablaufdatum oder Seriennummer. Ein Feld gilt \xFCberall oder nur in einem Eintrag und allem darunter. Mitgelieferte Felder lassen sich ausblenden.","fields.none":"Noch keine Felder.","fields.new":"Neues Feld","fields.edit":"Feld bearbeiten","fields.builtin":"mitgeliefert","fields.show":"Einblenden","fields.hide":"Ausblenden","fields.scopeGlobal":"gilt \xFCberall","fields.scopeLocal":"gilt nur in \u201E{name}\u201C","fields.scopeFixed":"Der Geltungsbereich l\xE4sst sich nachtr\xE4glich nicht \xE4ndern.","fields.scopeLabel":"Nur in diesem Eintrag und darunter (wahlweise)","fields.scopeHelp":"Ohne Auswahl gilt das Feld f\xFCr alle Eintr\xE4ge.","fields.typeLabel":"Art der Angabe","fields.type.text":"Text","fields.type.multiline":"Mehrzeiliger Text","fields.type.number":"Zahl","fields.type.date":"Datum","fields.type.bool":"Ja/Nein","fields.type.choice":"Auswahl","fields.type.link":"Link","fields.group":"Gruppen\xFCberschrift","fields.groupPlaceholder":"z. B. Ger\xE4t","fields.unit":"Einheit (z. B. kg)","fields.options":"Auswahlm\xF6glichkeiten","fields.optionsHelp":"Eine pro Zeile oder mit Kommas getrennt.","fields.remind":"Erinnerung vorher (Tage)","fields.remindNone":"keine","fields.remindHelp":"So viele Tage vor dem Datum erscheint der Eintrag unter \u201EF\xE4llig\u201C.","fields.remindShort":"Erinnerung {n} Tage vorher","fields.remindInvalid":"Die Erinnerung muss eine ganze Zahl ab 0 sein.","fields.restrict":"Nur f\xFCr bestimmte Eintr\xE4ge","fields.restrictHelp":"Ohne Auswahl gilt das Feld f\xFCr alle Klassen und Arten.","fields.deleteTitle":"Feld \u201E{name}\u201C l\xF6schen?","fields.deleteMessage":"Das Feld und alle eingetragenen Werte werden gel\xF6scht. Wenn du es nur nicht mehr sehen willst, blende es lieber aus.","fields.deleted":"Feld gel\xF6scht","synonyms.help":"Synonyme sind gleichwertige Begriffe. Wer nach \u201ETacker\u201C sucht, findet dann auch \u201EHefter\u201C.","synonyms.none":"Noch keine Synonyme.","synonyms.new":"Neue Gruppe","synonyms.edit":"Gruppe bearbeiten","synonyms.terms":"Begriffe","synonyms.termsHelp":"Mindestens zwei, mit Kommas getrennt.","synonyms.atLeastTwo":"Bitte nenne mindestens zwei Begriffe.","synonyms.deleted":"Gruppe gel\xF6scht","reminders.title":"Schwellen","reminders.invalid":"Alle Werte m\xFCssen ganze Zahlen ab 1 sein.","reminders.lent_days":"Ausgeliehenes ohne Datum gilt \xFCberf\xE4llig nach (Tagen)","reminders.lent_daysHelp":"Gilt nur f\xFCr Ausleihen ohne \u201Ezur\xFCck bis\u201C und ohne abgeschaltete Erinnerung.","reminders.stale_days":"Als \u201Elange nicht best\xE4tigt\u201C gilt nach (Tagen)","reminders.stale_daysHelp":"H\xE4ngt am Filter \u201Elange nicht best\xE4tigt\u201C der Suche.","reminders.trash_days":"Papierkorb aufbewahren (Tage)","reminders.trash_daysHelp":"Danach wird Gel\xF6schtes endg\xFCltig entfernt."};var $t={"app.title":"Storage","common.cancel":"Cancel","common.close":"Close","common.delete":"Delete","common.edit":"Edit","common.loading":"Loading \u2026","common.move":"Move","common.no":"No","common.save":"Save","common.start":"Home","common.yes":"Yes","nav.back":"Back","nav.browse":"Browse","nav.due":"Due","nav.main":"Main navigation","nav.menu":"Open sidebar","nav.overview":"Overview","nav.settings":"Settings","nav.trash":"Trash","class.place":"Rooms","class.furniture":"Furniture","class.container":"Containers","class.group":"Groups","class.item":"Things","classHelp.place":"a place where things stand","classHelp.furniture":"furniture or shelf","classHelp.container":"movable container","classHelp.group":"collective name for contents","classHelp.item":"a single thing","condition.ok":"fine","condition.missing":"missing","condition.defective":"defective","condition.to_sell":"to sell","condition.to_give_away":"to give away","condition.disposed":"disposed / given away","overview.welcome":"Welcome to Ordnungs-Tracker","overview.welcomeText":'Start by adding a room (e.g. "Cellar"), then a shelf and numbered boxes inside \u2013 and write down what is in them. A rough start is fine: you can refine later.',"overview.start":"Get started","overview.containers":"Containers","overview.items":"Things","overview.unsorted":"Unsorted","overview.checkedOut":"Checked out","overview.due":"Due","overview.restock":"Restock","overview.nextNumber":"Next free number: {n}","overview.value":"Total value: {value}","overview.favorites":"Favorites","overview.favoritesEmpty":"Tap the star on an entry and it shows up here.","overview.recent":"Recently viewed","overview.recentEmpty":"The entries you opened last show up here.","overview.emptyContainers":"Empty containers","node.rootTitle":"All places","node.new":"New","node.quick":"Quick add","node.selectAll":"Select all","node.contents":"Contents","node.selected":"{n} selected","node.selection":"Selection","node.favorite":"Add to favorites","node.unfavorite":"Remove from favorites","node.more":"More actions","node.kind":"Kind","node.owner":"Owner","node.inherited":"inherited","node.quantity":"Quantity","node.minimum":"minimum","node.aliases":"Also known as","node.tags":"Tags","node.note":"Note","node.condition":"Condition","node.lentTo":"Lent to","node.outAt":"Taken out, now","node.since":"since","node.until":"until","node.viaContainer":"via the container","node.unassigned":"no longer assigned","node.emptyRoot":'Nothing here yet. Tap "New" and add a room, for example "Cellar".',"node.emptyPlace":"Nothing in this room yet. Add a shelf or a box \u2013 or use quick add.","node.emptyContainer":'This box is empty. Tap "Quick add" and write down what goes in \u2013 one line per thing.',"node.emptyItem":"Nothing is stored here. If you put something in, the thing automatically becomes a group.","node.emptyGeneric":'Nothing here yet. Tap "New" or use quick add.',"node.emptyTrashed":"This entry is in the trash.","form.createTitle":"New entry","form.editTitle":"Edit entry","form.name":"Name","form.nameRequired":"Please enter a name.","form.kind":"Kind","form.number":"Number","form.numberNone":"none","form.numberInvalid":"Number, quantity and minimum stock must be numbers (number: whole, from 1).","form.more":"More details","form.aliases":"Also known as (comma separated)","form.tags":"Tags (comma separated)","form.owner":"Owner","form.ownerNone":"\u2013 none \u2013","form.ownerInherited":"\u2013 inherited from {name} \u2013","form.quantity":"Quantity","form.unit":"Unit","form.minQuantity":"Minimum stock","form.note":"Note","form.created":'"{name}" created',"form.saved":"Saved","quick.title":'Quick add in "{name}"',"quick.placeholder":`Scissors
3x AA batteries
2 rolls of tape
Craft supplies
  Colored paper
  Glue`,"quick.commas":"Commas separate entries (handy when dictating)","quick.help":"One line per thing. A leading quantity is recognized (3x \u2026, 2 rolls \u2026). Indented lines belong to the line above.","quick.preview":"This will be created ({n})","quick.apply":"Create {n}","quick.done":"{n} entries created","move.titleOne":"Move entry","move.titleMany":"Move {n} entries","move.search":"Search a target or enter a box number","move.searchPlaceholder":"e.g. shelf or 14","move.recent":"Recently used","move.browse":"Browse","move.chooseHere":'Choose "{name}"',"move.topLevel":"Top level","move.nothingBelow":"Nothing in here that could hold something.","move.open":'Open "{name}"',"move.target":"Target: {name}","move.noTarget":"Choose a target.","move.do":"Move here","move.done":'Moved {n} to "{name}"',"delete.title":'Delete "{name}"?',"delete.withContent":"It contains {n} sub-entries. What should happen to them?","delete.empty":"The entry will be moved to the trash.","delete.modeTrash":"To the trash including contents ({n} sub-entries)","delete.modeLift":"Remove only this entry; its contents move up one level","delete.trashInfo":"Everything stays restorable in the trash for {days} days.","delete.doneOne":'"{name}" moved to the trash',"delete.done":"{n} entries moved to the trash","delete.manyTitle":"Delete {n} entries?","delete.manyMessage":"The {n} selected entries are moved to the trash including their contents and can be restored there.","trash.info":"Deleted entries stay in the trash for {days} days and are then removed for good.","trash.none":"The trash is empty.","trash.restore":"Restore","trash.restored":'"{name}" restored',"trash.restoredUnsorted":'"{name}" restored \u2013 its old place no longer exists, so it is now in "Unsorted"',"trash.purge":"Delete permanently","trash.purgeTitle":'Delete "{name}" permanently?',"trash.purgeMessage":"The entry and {n} sub-entries are removed irrevocably. References from lists disappear.","trash.empty":"Empty trash","trash.emptyTitle":"Empty the trash?","trash.emptyMessage":"Everything in the trash is removed irrevocably.","trash.emptied":"{n} entries removed permanently","trash.withContent":"with {n} sub-entries","trash.deletedOn":"deleted on {date}","trash.bannerTop":"This entry is in the trash (deleted on {date}).","trash.bannerInside":"This entry belongs to a deleted entry. Restore the topmost entry.","search.placeholder":"Search or enter a number \u2026","search.filter":"Filters","search.moreFilters":"More filters","search.kind":"Kind","search.owner":"Owner","search.condition":"Condition","search.tag":"Tag","search.any":"any","search.fOut":"checked out","search.fNumber":"with number","search.fEmpty":"empty","search.fStale":"not verified for long","search.fArchived":"incl. archived","search.within":"inside one place","search.reset":"Reset filters","search.jump":'Jump to "{name}"',"search.count":"{n} results","search.countMore":"{n} results, showing the first {shown}","search.none":"Nothing found. Check the spelling or loosen the filters.","search.results":"Search results","due.title":"Due","due.none":"Nothing due. All good.","due.overdue":"overdue","due.expiring":"Expiring soon or expired","due.checkout_overdue":"Return overdue","due.below_min":"Below minimum stock","due.maintenance_due":"Maintenance due","due.missing":"Missing","sample.title":"Sample data","sample.load":"Load sample data","sample.help":"Loads a small sample household (about 60 entries) to try things out. You can remove it at any time.","sample.onlyEmpty":"Sample data can only be loaded into an empty inventory.","sample.active":"The sample data is loaded.","sample.loaded":"Sample data loaded","sample.remove":"Remove sample data","sample.removeTitle":"Remove sample data?","sample.removeMessage":'All sample entries are deleted. Entries of your own that you put into sample boxes move to "Unsorted".',"sample.removed":"Sample data removed","settings.tab.kinds":"Kinds","settings.tab.persons":"People","settings.tab.data":"Data","settings.kindsHelp":'A kind says what an entry is (room, shelf, box \u2026). Your own kinds \u2013 e.g. "Drawer" or "Suitcase" \u2013 always belong to one of five classes.',"settings.kindNew":"New kind","settings.kindEdit":"Edit kind","settings.kindDeleted":"Kind deleted","settings.class":"Class","settings.icon":"Icon (e.g. mdi:package-variant)","settings.numbered":"Entries of this kind usually get a number","settings.numberedShort":"numbered","settings.replacement":"This kind is still in use. Which kind should the entries be switched to?","settings.replaceDelete":"Switch and delete","settings.personsHelp":"People can own entries. Ownership is inherited downwards: if the workshop belongs to Dad, everything in it does too \u2013 unless something further down says otherwise.","settings.noPersons":"No people yet.","settings.personNew":"New person","settings.personEdit":"Edit person","settings.personDeleteTitle":'Delete "{name}"?',"settings.personDeleteMessage":"The assignment to entries is removed. The entries themselves stay.","settings.personDeleted":"Person deleted ({n} assignments removed)","settings.haPerson":"Link to a Home Assistant person","settings.noHaPerson":"\u2013 not linked \u2013","settings.about":"Ordnungs-Tracker {version} \xB7 {nodes} entries","data.export":"Export","data.exportHelp":"inventar.json contains all your data and can be backed up or taken to another system. The Markdown list is for reading and printing.","data.markdown":"Readable list (Markdown)","data.copy":"Copy to clipboard","data.copied":"inventar.json copied to the clipboard","data.exported":"{name} saved","data.import":"Import","data.importHelp":"A previously exported inventar.json replaces the whole inventory \u2013 after validation and confirmation. A backup is created first.","data.ready":"File read ({kb} KB)","data.importTitle":"Replace the inventory?","data.importMessage":"The entire current inventory will be replaced by the file. A backup of the current state is created first.","data.imported":"Imported ({n} entries)","card.title":"Title (optional)","card.mode":"Mode","card.modeSearch":"Search only","card.modeTiles":"Search with tiles","card.modeNode":"Contents of an entry","card.node":"Entry (id or number)","card.nodeHelp":"E.g. a box number: 14.","tree.label":"Places","tree.expand":'Expand "{name}"',"tree.collapse":'Collapse "{name}"',"quantity.group":"Amount of {name}","quantity.less":"One less: {name}","quantity.more":"One more: {name}","form.fields":"Custom details","form.fieldsOther":"Other","nav.out":"Checked out","nav.restock":"Restock","checkout.lend":"Lend to \u2026","checkout.takeOut":"Take out / store away","checkout.return":"Put back","checkout.titleLent":'Lend "{name}"',"checkout.titleOut":'Take out "{name}"',"checkout.toLent":"Lent to","checkout.toOut":"Where is it now?","checkout.placeholderLent":"e.g. Neighbour Huber","checkout.placeholderOut":"e.g. hanging on the Christmas tree","checkout.toRequiredLent":"Please say who it is lent to.","checkout.toRequiredOut":"Please say where it is now.","checkout.since":"Since","checkout.until":"Back by (optional)","checkout.noReminder":"Long-term loan: do not remind about returning it","checkout.noReminderHelp":'For things that stay with someone else for good. Without a return date the Ordnungs-Tracker would otherwise report "overdue" after the set time.',"checkout.done":'"{name}" is now checked out',"checkout.returned":'"{name}" is back in its place',"checkout.reminderOn":"Reminder switched on","checkout.reminderOff":"Reminder switched off","checkout.reminderOnShort":"Reminder on","checkout.reminderOffShort":"Reminder off","maintenance.section":"Maintenance","maintenance.add":"Task","maintenance.none":"No maintenance tasks.","maintenance.new":"New maintenance task","maintenance.edit":"Edit maintenance task","maintenance.title":"Task","maintenance.titlePlaceholder":"e.g. Change filter","maintenance.titleRequired":"Please give the task a name.","maintenance.intervalInvalid":"The interval must be a whole number from 1.","maintenance.every":"Every","maintenance.once":"once","maintenance.unit":"Unit","maintenance.unit.days":"days","maintenance.unit.weeks":"weeks","maintenance.unit.months":"months","maintenance.unit.years":"years","maintenance.nextDue":"Next due","maintenance.everyText":"every {n} {unit}","maintenance.due":"due","maintenance.noDate":"no date","maintenance.last":"last {date}","maintenance.soon":"in {n} days","maintenance.done":"Done","maintenance.doneToast":'"{title}" done',"maintenance.saved":"Maintenance task saved","maintenance.removed":"Maintenance task deleted","maintenance.deleteTitle":'Delete "{title}"?',"maintenance.deleteMessage":"The task and its log are deleted for good.","out.title":"Checked out","out.none":"Everything is in its place.","out.home":"Home: {path}","out.days":"away for {n} days","restock.title":"Restock","restock.none":"Nothing to restock. All amounts are sufficient.","restock.toTodo":"To the to-do list","restock.transferred":"{added} added to the to-do list, {skipped} were already on it","restock.noTodo":"No to-do list is chosen. Choose it under Settings \u2192 Devices & services \u2192 Ordnungs-Tracker \u2192 Configure.","restock.todoTitle":"To-do list for restocking","restock.todoAuto":"Restock items are added to {entity} automatically as soon as something falls below its minimum.","restock.todoManual":"Restock items can be sent to {entity} with one tap. To do it automatically, switch it on in the options.","restock.todoWhere":"You set the list and automatic transfer under Settings \u2192 Devices & services \u2192 Ordnungs-Tracker \u2192 Configure.","picker.change":"Change","picker.placeholder":"Search name or number \u2026","settings.tab.fields":"Fields","settings.tab.synonyms":"Synonyms","settings.tab.reminders":"Reminders","fields.help":"Custom fields hold details per entry, such as an expiry date or serial number. A field applies everywhere or only in one entry and everything below it. Built-in fields can be hidden.","fields.none":"No fields yet.","fields.new":"New field","fields.edit":"Edit field","fields.builtin":"built-in","fields.show":"Show","fields.hide":"Hide","fields.scopeGlobal":"applies everywhere","fields.scopeLocal":'applies only in "{name}"',"fields.scopeFixed":"The scope cannot be changed afterwards.","fields.scopeLabel":"Only in this entry and below (optional)","fields.scopeHelp":"Without a choice the field applies to all entries.","fields.typeLabel":"Type of detail","fields.type.text":"Text","fields.type.multiline":"Multi-line text","fields.type.number":"Number","fields.type.date":"Date","fields.type.bool":"Yes/No","fields.type.choice":"Choice","fields.type.link":"Link","fields.group":"Group heading","fields.groupPlaceholder":"e.g. Device","fields.unit":"Unit (e.g. kg)","fields.options":"Choices","fields.optionsHelp":"One per line or separated by commas.","fields.remind":"Remind beforehand (days)","fields.remindNone":"none","fields.remindHelp":'This many days before the date the entry shows up under "Due".',"fields.remindShort":"reminder {n} days before","fields.remindInvalid":"The reminder must be a whole number from 0.","fields.restrict":"Only for certain entries","fields.restrictHelp":"Without a choice the field applies to all classes and kinds.","fields.deleteTitle":'Delete field "{name}"?',"fields.deleteMessage":"The field and all entered values are deleted. If you just do not want to see it, hide it instead.","fields.deleted":"Field deleted","synonyms.help":'Synonyms are equivalent terms. Searching for "stapler" then also finds "tacker".',"synonyms.none":"No synonyms yet.","synonyms.new":"New group","synonyms.edit":"Edit group","synonyms.terms":"Terms","synonyms.termsHelp":"At least two, separated by commas.","synonyms.atLeastTwo":"Please give at least two terms.","synonyms.deleted":"Group deleted","reminders.title":"Thresholds","reminders.invalid":"All values must be whole numbers from 1.","reminders.lent_days":"Loans without a date count as overdue after (days)","reminders.lent_daysHelp":'Only applies to loans without "back by" and with the reminder left on.',"reminders.stale_days":'Counts as "not confirmed for a long time" after (days)',"reminders.stale_daysHelp":'Used by the search filter "not confirmed for a long time".',"reminders.trash_days":"Keep the trash for (days)","reminders.trash_daysHelp":"After that deleted items are removed for good."};var Yt={de:Ke,en:$t};function Fe(a){return(a??"de").toLowerCase().startsWith("de")?"de":"en"}function B(a){let t=Yt[Fe(a)];return(e,i)=>{let s=t[e]??Ke[e]??e;if(i)for(let[n,o]of Object.entries(i))s=s.replaceAll(`{${n}}`,String(o));return s}}var _="/ordnungstracker",Jt=["place","furniture","container","group","item"];function Xt(a,t){a.kinds?.length&&t.set("kind",a.kinds.join(",")),a.classes?.length&&t.set("class",a.classes.join(",")),a.within&&t.set("within",a.within),a.owner&&t.set("owner",a.owner),a.tag&&t.set("tag",a.tag),a.condition&&t.set("cond",a.condition),a.checked_out!==void 0&&t.set("out",a.checked_out?"1":"0"),a.has_number&&t.set("num","1"),a.empty&&t.set("empty","1"),a.stale&&t.set("stale","1"),a.include_archived&&t.set("arch","1")}function ei(a){let t={},e=a.get("kind");e&&(t.kinds=e.split(",").filter(Boolean));let i=a.get("class");i&&(t.classes=i.split(",").filter(s=>Jt.includes(s)));for(let[s,n]of[["within","within"],["owner","owner"],["tag","tag"],["cond","condition"]]){let o=a.get(s);o&&(t[n]=o)}return a.get("out")==="1"&&(t.checked_out=!0),a.get("out")==="0"&&(t.checked_out=!1),a.get("num")==="1"&&(t.has_number=!0),a.get("empty")==="1"&&(t.empty=!0),a.get("stale")==="1"&&(t.stale=!0),a.get("arch")==="1"&&(t.include_archived=!0),t}function w(a){switch(a.page){case"overview":return _;case"node":return a.id?`${_}/node/${encodeURIComponent(a.id)}`:`${_}/node`;case"number":return`${_}/nr/${a.number}`;case"search":{let t=new URLSearchParams;a.query&&t.set("q",a.query),Xt(a.filters,t);let e=t.toString();return`${_}/search${e?`?${e}`:""}`}case"trash":return`${_}/trash`;case"due":return`${_}/due`;case"out":return`${_}/out`;case"restock":return`${_}/restock`;case"settings":return a.section?`${_}/settings/${a.section}`:`${_}/settings`}}function xt(a){let[t,e=""]=a.split("?",2),i=new URLSearchParams(e),n=(t.startsWith(_)?t.slice(_.length):t).split("/").filter(Boolean).map(decodeURIComponent);switch(n[0]){case"node":return{page:"node",id:n[1]??null};case"nr":{let o=Number.parseInt(n[1]??"",10);return Number.isInteger(o)&&o>0?{page:"number",number:o}:{page:"overview"}}case"search":return{page:"search",query:i.get("q")??"",filters:ei(i)};case"trash":return{page:"trash"};case"due":return{page:"due"};case"out":return{page:"out"};case"restock":return{page:"restock"};case"settings":return{page:"settings",section:n[1]??""};default:return{page:"overview"}}}var re=class{constructor(t){this.win=t;this.listeners=new Set;this.handler=()=>this.emit()}start(){this.win.addEventListener("popstate",this.handler),this.win.addEventListener("location-changed",this.handler)}stop(){this.win.removeEventListener("popstate",this.handler),this.win.removeEventListener("location-changed",this.handler)}current(){return xt(this.win.location.pathname+this.win.location.search)}navigate(t,e={}){let i=w(t);i!==this.win.location.pathname+this.win.location.search&&(e.replace?this.win.history.replaceState(null,"",i):this.win.history.pushState(null,"",i),this.win.dispatchEvent(new CustomEvent("location-changed")))}back(){this.win.history.back()}subscribe(t){return this.listeners.add(t),()=>this.listeners.delete(t)}emit(){let t=this.current();for(let e of this.listeners)e(t)}};var ti=/^(kind|person|field_def|synonyms|settings|template|sample|import|restore|list|reload|rollback)/,wt=3e3,ii=2,je=class extends u{constructor(){super();this._api=null;this._nav=new re(window);this._revision=0;this._catalog=null;this._status=null;this._toastSeq=0;this._started=!1;this._bumpDebounced=x(()=>{this._revision++,this._rebuild()},120);this._typeSearch=x(e=>{let i=this._route,s=i.page==="search"?i.filters:{};if(!e.trim()&&i.page==="search"&&Object.keys(s).length===0){this._nav.navigate({page:"overview"},{replace:!0});return}!e.trim()&&i.page!=="search"||this._nav.navigate({page:"search",query:e,filters:s},{replace:i.page==="search"})},250);this.narrow=!1,this._route={page:"overview"},this._ctx=null,this._toasts=[],this._confirm=null,this._search="",this._numberId=null,this._booting=!0,this._fatal=""}static{this.properties={hass:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},panel:{attribute:!1},_route:{state:!0},_ctx:{state:!0},_toasts:{state:!0},_confirm:{state:!0},_search:{state:!0},_numberId:{state:!0},_booting:{state:!0},_fatal:{state:!0}}}static{this.styles=[p,v`
      :host {
        display: block;
        min-height: 100%;
        background: var(--primary-background-color);
        --ot-touch: 48px;
      }
      header.bar {
        position: sticky;
        top: 0;
        z-index: 8;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        min-height: 56px;
        background: var(--app-header-background-color, var(--primary-color));
        color: var(--app-header-text-color, var(--text-primary-color, #fff));
      }
      header.bar .icon-btn {
        color: inherit;
      }
      header.bar h1 {
        font-size: 1.15rem;
        padding: 0 8px;
        white-space: nowrap;
      }
      header.bar input[type="search"] {
        flex: 1;
        min-width: 0;
        background: color-mix(in srgb, #fff 22%, transparent);
        color: inherit;
        border: none;
        border-radius: 24px;
        padding: 0 16px;
        min-height: 40px;
      }
      header.bar input::placeholder {
        color: inherit;
        opacity: 0.8;
      }
      nav.top {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 10px 16px 0;
        max-width: 1200px;
        margin: 0 auto;
      }
      .layout {
        display: flex;
        align-items: flex-start;
        max-width: 1200px;
        margin: 0 auto;
      }
      aside {
        width: 280px;
        flex: none;
        position: sticky;
        top: 64px;
        max-height: calc(100dvh - 72px);
        overflow-y: auto;
        padding: 12px 0 12px 12px;
      }
      main {
        flex: 1;
        min-width: 0;
        padding: 12px 16px 96px;
      }
      .toasts {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        top: 64px;
        z-index: 30;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: min(480px, 100vw - 32px);
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--primary-text-color);
        color: var(--primary-background-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      }
      .toast.error {
        background: var(--error-color, #db4437);
        color: #fff;
      }
    `]}connectedCallback(){super.connectedCallback(),this._nav.start(),this._route=this._nav.current(),this._unsubRoute=this._nav.subscribe(e=>this._onRoute(e))}disconnectedCallback(){super.disconnectedCallback(),this._nav.stop(),this._unsubRoute?.(),this._unsub?.(),this._unsub=void 0,this._started=!1}shouldUpdate(e){if(this.hasUpdated&&e.size===1&&e.has("hass")){let i=e.get("hass");return!i||i.language!==this.hass.language}return!0}willUpdate(e){e.has("narrow")&&this._api&&this._rebuild(),e.has("hass")&&this.hass&&(this._api?this._api.setHass(this.hass):this._api=new z(this.hass),this._started?e.get("hass")&&e.get("hass").language!==this.hass.language&&this._rebuild():(this._started=!0,this._boot()))}async _boot(){try{await this._loadCatalog(),this._booting=!1,this._unsub=await this._api.subscribe(e=>this._changed(e))}catch(e){this._fatal=e instanceof M&&e.code==="not_loaded"?e.message:h(e),this._booting=!1}}async _loadCatalog(){let[e,i]=await Promise.all([this._api.catalog(),this._api.status()]);this._catalog=e,this._status=i,this._rebuild()}_changed(e){e.reload||e.actions.some(i=>ti.test(i))?this._loadCatalog().then(()=>this._bumpDebounced()):(this._api.status().then(i=>{this._status=i}),this._bumpDebounced())}_rebuild(){if(!this._api)return;let e=Fe(this.hass?.language),i=this;this._ctx={get hass(){return i.hass},api:this._api,t:B(this.hass?.language),lang:e,nav:this._nav,catalog:this._catalog,status:this._status,narrow:this.narrow,revision:this._revision,go:(s,n)=>this._nav.navigate(s,n),toast:(s,n)=>i._toast(s,n),confirm:s=>i._askConfirm(s),reloadCatalog:()=>i._loadCatalog()}}_toast(e,i="info"){let s=++this._toastSeq;this._toasts=[...this._toasts,{id:s,message:e,kind:i}].slice(-ii),setTimeout(()=>this._toasts=this._toasts.filter(n=>n.id!==s),i==="error"?wt*2:wt)}_askConfirm(e){return new Promise(i=>{this._confirm={...e,resolve:i}})}_answer(e){this._confirm?.resolve(e),this._confirm=null}async _onRoute(e){if(this._route=e,this._numberId=null,e.page==="search"?this._search=e.query:e.page==="overview"&&(this._search=""),e.page==="number")try{let i=await this._api.byNumber(e.number);this._route===e&&(this._numberId={number:e.number,id:i.id})}catch(i){this._toast(h(i),"error"),this._nav.navigate({page:"overview"},{replace:!0})}}updated(){this.renderRoot.querySelector("nav.top .chip[aria-pressed=true]")?.scrollIntoView?.({inline:"center",block:"nearest"})}firstUpdated(){this._onRoute(this._route)}async _enter(){this._typeSearch.cancel();let e=A(this._search);if(e===null){let i=this._route;this._nav.navigate({page:"search",query:this._search,filters:i.page==="search"?i.filters:{}});return}try{let i=await this._api.byNumber(e);this._nav.navigate({page:"node",id:i.id})}catch{this._nav.navigate({page:"search",query:this._search,filters:{}})}}_back(){window.history.length>1?this._nav.back():this._nav.navigate({page:"overview"})}render(){let e=this._ctx,i=e?.t??B(this.hass?.language),s=this._route.page==="overview";return r`
      <header class="bar">
        ${this.narrow?r`<button class="icon-btn" aria-label=${i("nav.menu")} @click=${()=>this.dispatchEvent(new Event("hass-toggle-menu",{bubbles:!0,composed:!0}))}><ha-icon icon="mdi:menu"></ha-icon></button>`:l}
        ${s?l:r`<button class="icon-btn" aria-label=${i("nav.back")} @click=${this._back}><ha-icon icon="mdi:arrow-left"></ha-icon></button>`}
        ${this.narrow?l:r`<h1>${i("app.title")}</h1>`}
        <input
          type="search"
          .value=${this._search}
          placeholder=${i("search.placeholder")}
          aria-label=${i("search.placeholder")}
          enterkeyhint="search"
          @input=${n=>{this._search=n.target.value,this._typeSearch(this._search)}}
          @keydown=${n=>n.key==="Enter"&&this._enter()}
        />
        <button class="icon-btn" aria-label=${i("nav.settings")} @click=${()=>this._nav.navigate({page:"settings",section:""})}><ha-icon icon="mdi:cog-outline"></ha-icon></button>
      </header>
      ${this._booting?r`<main><div class="empty muted">${i("common.loading")}</div></main>`:this._fatal?r`<main><div class="empty"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><p class="error-text" role="alert">${this._fatal}</p></div></main>`:e?this._layout(e):l}
      <div class="toasts" aria-live="polite">
        ${this._toasts.map(n=>r`<div class="toast ${n.kind}" role=${n.kind==="error"?"alert":"status"}>${n.message}</div>`)}
      </div>
      ${this._confirm?r`<ot-confirm
            .heading=${this._confirm.title}
            .message=${this._confirm.message}
            .confirmLabel=${this._confirm.confirmLabel}
            .cancelLabel=${i("common.cancel")}
            .danger=${this._confirm.danger??!1}
            @confirm=${()=>this._answer(!0)}
            @cancel=${()=>this._answer(!1)}
          ></ot-confirm>`:l}
    `}_layout(e){let i=e.t,s=this._route,n=s.page==="node"?s.id??"":s.page==="number"?this._numberId?.id??"":"",o=(d,c,g,m)=>r`<button class="chip" style="min-height:36px" aria-pressed=${s.page===d?"true":"false"} @click=${()=>this._nav.navigate(g)}><ha-icon icon=${m} style="--mdc-icon-size:18px"></ha-icon>${c}</button>`;return r`
      <nav class="top" aria-label=${i("nav.main")}>
        ${o("overview",i("nav.overview"),{page:"overview"},"mdi:view-dashboard-outline")}
        ${o("node",i("nav.browse"),{page:"node",id:null},"mdi:folder-outline")}
        ${o("due",i("nav.due"),{page:"due"},"mdi:calendar-alert")}
        ${o("out",i("nav.out"),{page:"out"},"mdi:package-up")}
        ${o("restock",i("nav.restock"),{page:"restock"},"mdi:cart-outline")}
        ${o("trash",i("nav.trash"),{page:"trash"},"mdi:delete-outline")}
      </nav>
      <div class="layout">
        ${this.narrow?l:r`<aside><ot-tree .ctx=${e} .currentId=${n}></ot-tree></aside>`}
        <main>${this._page(e)}</main>
      </div>
    `}_page(e){let i=this._route;switch(i.page){case"overview":return r`<ot-overview .ctx=${e}></ot-overview>`;case"node":return r`<ot-node-page .ctx=${e} .nodeId=${i.id}></ot-node-page>`;case"number":return this._numberId?r`<ot-node-page .ctx=${e} .nodeId=${this._numberId.id}></ot-node-page>`:r`<div class="empty muted">${e.t("common.loading")}</div>`;case"search":return r`<ot-search-page .ctx=${e} .query=${i.query} .filters=${i.filters}></ot-search-page>`;case"trash":return r`<ot-trash-page .ctx=${e}></ot-trash-page>`;case"due":return r`<ot-due-page .ctx=${e}></ot-due-page>`;case"restock":return r`<ot-due-page .ctx=${e} only="below_min"></ot-due-page>`;case"out":return r`<ot-out-page .ctx=${e}></ot-out-page>`;case"settings":return r`<ot-settings-page .ctx=${e} .section=${i.section}></ot-settings-page>`}}};customElements.define("ordnungstracker-panel",je);function U(a){window.history.pushState(null,"",a),window.dispatchEvent(new CustomEvent("location-changed"))}var We=class extends u{constructor(){super();this._api=null;this._started=!1;this._reload=x(()=>{this._load()},200);this._typed=x(()=>{this._search().catch(e=>this._error=h(e))},250);this._config={type:"custom:ordnungstracker-card",mode:"search"},this._query="",this._hits=[],this._overview=null,this._node=null,this._error=""}static{this.properties={hass:{attribute:!1},_config:{state:!0},_query:{state:!0},_hits:{state:!0},_overview:{state:!0},_node:{state:!0},_error:{state:!0}}}static getConfigElement(){return document.createElement("ordnungstracker-card-editor")}static getStubConfig(){return{type:"custom:ordnungstracker-card",mode:"tiles"}}setConfig(e){if(!e||typeof e!="object")throw new Error("Ung\xFCltige Konfiguration");if(e.mode&&!["search","tiles","node"].includes(e.mode))throw new Error(`Unbekannte Betriebsart: ${e.mode} (erlaubt: search, tiles, node)`);if(e.mode==="node"&&!e.node)throw new Error('Bei mode: node fehlt "node" (Kennung oder Nummer, z. B. 14).');this._config={...e,mode:e.mode??"search"},this._started&&this._load()}getCardSize(){return this._config.mode==="tiles"?4:this._config.mode==="node"?5:3}static{this.styles=[p,v`
      :host {
        display: block;
      }
      ha-card {
        display: block;
        padding: 12px 16px 16px;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 1.2rem;
      }
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 8px;
        margin-top: 12px;
      }
      .tile {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: transparent;
        padding: 10px 12px;
        text-align: left;
        min-height: 64px;
      }
      .tile .n {
        font-size: 1.5rem;
        font-weight: 500;
        display: block;
      }
      .tile .l {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
      }
      .list {
        border: none;
        margin-top: 8px;
        border-radius: 0;
      }
    `]}connectedCallback(){super.connectedCallback(),this._api&&!this._unsub&&this._start()}disconnectedCallback(){super.disconnectedCallback(),this._unsub?.(),this._unsub=void 0,this._started=!1}willUpdate(e){e.has("hass")&&this.hass&&(this._api?this._api.setHass(this.hass):this._api=new z(this.hass),this._started||this._start())}shouldUpdate(e){return!(this.hasUpdated&&e.size===1&&e.has("hass"))}async _start(){this._started=!0,await this._load();try{this._unsub=await this._api.subscribe(()=>this._reload())}catch{}}async _load(){let e=this._api;if(e)try{this._error="";let i=this._config.mode;if(i==="tiles"&&(this._overview=await e.overview()),i==="node"){let s=String(this._config.node??"").trim(),n=A(s),o=n!==null?(await e.byNumber(n)).id:s;this._node=await e.node(o)}(i==="search"||i==="tiles")&&await this._search()}catch(i){this._error=h(i)}}async _search(){if(!this._query.trim()){this._hits=[];return}this._hits=(await this._api.search(this._query,{},8)).hits}async _enter(){let e=A(this._query);if(e!==null)try{U(w({page:"node",id:(await this._api.byNumber(e)).id}));return}catch{}U(w({page:"search",query:this._query,filters:{}}))}render(){let e=B(this.hass?.language),i=this._config.mode;return r`
      <ha-card>
        ${this._config.title?r`<h2>${this._config.title}</h2>`:l}
        ${i==="node"?this._nodeView(e):r`${this._searchBox(e)}${this._results(e)}${i==="tiles"?this._tiles(e):l}`}
        ${this._error?r`<div class="error-text small" role="alert">${this._error}</div>`:l}
      </ha-card>
    `}_searchBox(e){return r`<input
      type="search"
      .value=${this._query}
      placeholder=${e("search.placeholder")}
      aria-label=${e("search.placeholder")}
      @input=${i=>{this._query=i.target.value,this._typed()}}
      @keydown=${i=>i.key==="Enter"&&this._enter()}
    />`}_results(e){return this._query.trim()?this._hits.length===0?r`<div class="small muted" style="margin-top:8px">${e("search.none")}</div>`:r`<div class="list">
      ${this._hits.map(i=>r`<button class="item" @click=${()=>U(w({page:"node",id:i.id}))}>
          <span class="grow">
            <span class="row">${i.number!==null?r`<span class="badge">${i.number}</span>`:l}<span class="ellipsis">${i.name}</span></span>
            <span class="small muted ellipsis" style="display:block">${k(i.path,!1)}</span>
          </span>
        </button>`)}
    </div>`:l}_tiles(e){let i=this._overview?.overview;if(!i)return l;let s=Object.entries(i.due).filter(([o])=>o!=="below_min").reduce((o,[,d])=>o+d,0),n=(o,d,c)=>r`<button class="tile" @click=${()=>U(c)}><span class="n">${o}</span><span class="l">${d}</span></button>`;return r`<div class="tiles">
      ${n(i.containers,e("overview.containers"),_)}
      ${n(i.items,e("overview.items"),_)}
      ${n(i.unsorted,e("overview.unsorted"),w({page:"node",id:"unsortiert"}))}
      ${n(i.checked_out,e("overview.checkedOut"),w({page:"search",query:"",filters:{checked_out:!0}}))}
      ${n(s,e("overview.due"),w({page:"due"}))}
      ${n(i.due.below_min??0,e("overview.restock"),w({page:"due"}))}
    </div>`}_nodeView(e){let i=this._node;if(!i)return r`<div class="muted small">${e("common.loading")}</div>`;let s=i.id!==null?i:null;return r`
      ${s?r`<button class="btn text" style="padding:0" @click=${()=>U(w({page:"node",id:s.id}))}><strong>${s.number!==null?`${s.number} \xB7 `:""}${s.name}</strong></button>
            <div class="small muted">${k(s.path,!1)}</div>`:l}
      ${i.contents.length?r`<ot-node-list class="list" .rows=${i.contents.map(n=>O(n))} .label=${s?.name??""} @open-node=${n=>U(w({page:"node",id:n.detail}))}></ot-node-list>`:r`<div class="small muted" style="margin-top:8px">${e("node.emptyGeneric")}</div>`}
    `}};customElements.define("ordnungstracker-card",We);var Ve=class extends u{static{this.properties={hass:{attribute:!1},_config:{state:!0}}}constructor(){super(),this._config={type:"custom:ordnungstracker-card",mode:"search"}}static{this.styles=[p,v`:host { display: block; } .stack { display: flex; flex-direction: column; gap: 14px; }`]}setConfig(t){this._config=t}_set(t){let e={...this._config,...t};for(let i of["title","node"])e[i]||delete e[i];e.mode!=="node"&&delete e.node,this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}render(){let t=B(this.hass?.language),e=this._config;return r`<div class="stack">
      <label class="field">${t("card.title")}<input .value=${e.title??""} @input=${i=>this._set({title:i.target.value})} /></label>
      <label class="field">${t("card.mode")}
        <select .value=${e.mode??"search"} @change=${i=>this._set({mode:i.target.value})}>
          <option value="search" ?selected=${(e.mode??"search")==="search"}>${t("card.modeSearch")}</option>
          <option value="tiles" ?selected=${e.mode==="tiles"}>${t("card.modeTiles")}</option>
          <option value="node" ?selected=${e.mode==="node"}>${t("card.modeNode")}</option>
        </select></label>
      ${e.mode==="node"?r`<label class="field">${t("card.node")}<input .value=${e.node??""} placeholder="14" @input=${i=>this._set({node:i.target.value})} /></label>
            <span class="small muted">${t("card.nodeHelp")}</span>`:l}
    </div>`}};customElements.define("ordnungstracker-card-editor",Ve);window.customCards=window.customCards||[];window.customCards.push({type:"ordnungstracker-card",name:"Ordnungs-Tracker",description:"Suche, Kacheln oder der Inhalt einer Kiste aus dem Ordnungs-Tracker.",preview:!1});
