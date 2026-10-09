/* Ordnungs-Tracker 0.4.0 – gebautes Bündel, Quelltext: frontend/ */
var Z=globalThis,Y=Z.ShadowRoot&&(Z.ShadyCSS===void 0||Z.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ne=Symbol(),Ie=new WeakMap,B=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==ne)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Y&&t===void 0){let i=e!==void 0&&e.length===1;i&&(t=Ie.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&Ie.set(e,t))}return t}toString(){return this.cssText}},Oe=r=>new B(typeof r=="string"?r:r+"",void 0,ne),g=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((i,s,n)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+r[n+1],r[0]);return new B(e,r,ne)},ze=(r,t)=>{if(Y)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let i=document.createElement("style"),s=Z.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=e.cssText,r.appendChild(i)}},re=Y?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let i of t.cssRules)e+=i.cssText;return Oe(e)})(r):r;var{is:ut,defineProperty:mt,getOwnPropertyDescriptor:gt,getOwnPropertyNames:vt,getOwnPropertySymbols:ft,getPrototypeOf:_t}=Object,J=globalThis,Be=J.trustedTypes,bt=Be?Be.emptyScript:"",yt=J.reactiveElementPolyfillSupport,U=(r,t)=>r,ae={toAttribute(r,t){switch(t){case Boolean:r=r?bt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},Ke=(r,t)=>!ut(r,t),Ue={attribute:!0,type:String,converter:ae,reflect:!1,useDefault:!1,hasChanged:Ke};Symbol.metadata??=Symbol("metadata"),J.litPropertyMetadata??=new WeakMap;var k=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ue){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let i=Symbol(),s=this.getPropertyDescriptor(t,i,e);s!==void 0&&mt(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){let{get:s,set:n}=gt(this.prototype,t)??{get(){return this[e]},set(o){this[e]=o}};return{get:s,set(o){let d=s?.call(this);n?.call(this,o),this.requestUpdate(t,d,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ue}static _$Ei(){if(this.hasOwnProperty(U("elementProperties")))return;let t=_t(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(U("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(U("properties"))){let e=this.properties,i=[...vt(e),...ft(e)];for(let s of i)this.createProperty(s,e[s])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[i,s]of e)this.elementProperties.set(i,s)}this._$Eh=new Map;for(let[e,i]of this.elementProperties){let s=this._$Eu(e,i);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let i=new Set(t.flat(1/0).reverse());for(let s of i)e.unshift(re(s))}else t!==void 0&&e.push(re(t));return e}static _$Eu(t,e){let i=e.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ze(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){let i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(s!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:ae).toAttribute(e,i.type);this._$Em=t,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){let i=this.constructor,s=i._$Eh.get(t);if(s!==void 0&&this._$Em!==s){let n=i.getPropertyOptions(s),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:ae;this._$Em=s;let d=o.fromAttribute(e,n.type);this[s]=d??this._$Ej?.get(s)??d,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(t!==void 0){let o=this.constructor;if(s===!1&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??Ke)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),n!==!0||o!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[s,n]of i){let{wrapped:o}=n,d=this[s];o!==!0||this._$AL.has(s)||d===void 0||this.C(s,void 0,n,d)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(e)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};k.elementStyles=[],k.shadowRootOptions={mode:"open"},k[U("elementProperties")]=new Map,k[U("finalized")]=new Map,yt?.({ReactiveElement:k}),(J.reactiveElementVersions??=[]).push("2.1.2");var ue=globalThis,je=r=>r,X=ue.trustedTypes,Fe=X?X.createPolicy("lit-html",{createHTML:r=>r}):void 0,Ye="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,Je="?"+A,xt=`<${Je}>`,R=document,j=()=>R.createComment(""),F=r=>r===null||typeof r!="object"&&typeof r!="function",me=Array.isArray,$t=r=>me(r)||typeof r?.[Symbol.iterator]=="function",oe=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ve=/-->/g,We=/>/g,T=RegExp(`>|${oe}(?:([^\\s"'>=/]+)(${oe}*=${oe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Qe=/'/g,Ge=/"/g,Xe=/^(?:script|style|textarea|title)$/i,ge=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),a=ge(1),Ft=ge(2),Vt=ge(3),L=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),Ze=new WeakMap,P=R.createTreeWalker(R,129);function et(r,t){if(!me(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Fe!==void 0?Fe.createHTML(t):t}var wt=(r,t)=>{let e=r.length-1,i=[],s,n=t===2?"<svg>":t===3?"<math>":"",o=K;for(let d=0;d<e;d++){let l=r[d],m,p,f=-1,w=0;for(;w<l.length&&(o.lastIndex=w,p=o.exec(l),p!==null);)w=o.lastIndex,o===K?p[1]==="!--"?o=Ve:p[1]!==void 0?o=We:p[2]!==void 0?(Xe.test(p[2])&&(s=RegExp("</"+p[2],"g")),o=T):p[3]!==void 0&&(o=T):o===T?p[0]===">"?(o=s??K,f=-1):p[1]===void 0?f=-2:(f=o.lastIndex-p[2].length,m=p[1],o=p[3]===void 0?T:p[3]==='"'?Ge:Qe):o===Ge||o===Qe?o=T:o===Ve||o===We?o=K:(o=T,s=void 0);let S=o===T&&r[d+1].startsWith("/>")?" ":"";n+=o===K?l+xt:f>=0?(i.push(m),l.slice(0,f)+Ye+l.slice(f)+A+S):l+A+(f===-2?d:S)}return[et(r,n+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]},V=class r{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0,d=t.length-1,l=this.parts,[m,p]=wt(t,e);if(this.el=r.createElement(m,i),P.currentNode=this.el.content,e===2||e===3){let f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(s=P.nextNode())!==null&&l.length<d;){if(s.nodeType===1){if(s.hasAttributes())for(let f of s.getAttributeNames())if(f.endsWith(Ye)){let w=p[o++],S=s.getAttribute(f).split(A),G=/([.?@])?(.*)/.exec(w);l.push({type:1,index:n,name:G[2],strings:S,ctor:G[1]==="."?ce:G[1]==="?"?de:G[1]==="@"?he:q}),s.removeAttribute(f)}else f.startsWith(A)&&(l.push({type:6,index:n}),s.removeAttribute(f));if(Xe.test(s.tagName)){let f=s.textContent.split(A),w=f.length-1;if(w>0){s.textContent=X?X.emptyScript:"";for(let S=0;S<w;S++)s.append(f[S],j()),P.nextNode(),l.push({type:2,index:++n});s.append(f[w],j())}}}else if(s.nodeType===8)if(s.data===Je)l.push({type:2,index:n});else{let f=-1;for(;(f=s.data.indexOf(A,f+1))!==-1;)l.push({type:7,index:n}),f+=A.length-1}n++}}static createElement(t,e){let i=R.createElement("template");return i.innerHTML=t,i}};function N(r,t,e=r,i){if(t===L)return t;let s=i!==void 0?e._$Co?.[i]:e._$Cl,n=F(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(r),s._$AT(r,e,i)),i!==void 0?(e._$Co??=[])[i]=s:e._$Cl=s),s!==void 0&&(t=N(r,s._$AS(r,t.values),s,i)),t}var le=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??R).importNode(e,!0);P.currentNode=s;let n=P.nextNode(),o=0,d=0,l=i[0];for(;l!==void 0;){if(o===l.index){let m;l.type===2?m=new W(n,n.nextSibling,this,t):l.type===1?m=new l.ctor(n,l.name,l.strings,this,t):l.type===6&&(m=new pe(n,this,t)),this._$AV.push(m),l=i[++d]}o!==l?.index&&(n=P.nextNode(),o++)}return P.currentNode=R,s}p(t){let e=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}},W=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=N(this,t,e),F(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==L&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):$t(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&F(this._$AH)?this._$AA.nextSibling.data=t:this.T(R.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:i}=t,s=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=V.createElement(et(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{let n=new le(s,this),o=n.u(this.options);n.p(e),this.T(o),this._$AH=n}}_$AC(t){let e=Ze.get(t.strings);return e===void 0&&Ze.set(t.strings,e=new V(t)),e}k(t){me(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,i,s=0;for(let n of t)s===e.length?e.push(i=new r(this.O(j()),this.O(j()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let i=je(t).nextSibling;je(t).remove(),t=i}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},q=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=c}_$AI(t,e=this,i,s){let n=this.strings,o=!1;if(n===void 0)t=N(this,t,e,0),o=!F(t)||t!==this._$AH&&t!==L,o&&(this._$AH=t);else{let d=t,l,m;for(t=n[0],l=0;l<n.length-1;l++)m=N(this,d[i+l],e,l),m===L&&(m=this._$AH[l]),o||=!F(m)||m!==this._$AH[l],m===c?t=c:t!==c&&(t+=(m??"")+n[l+1]),this._$AH[l]=m}o&&!s&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},ce=class extends q{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},de=class extends q{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},he=class extends q{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=N(this,t,e,0)??c)===L)return;let i=this._$AH,s=t===c&&i!==c||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==c&&(i===c||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},pe=class{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){N(this,t)}};var kt=ue.litHtmlPolyfillSupport;kt?.(V,W),(ue.litHtmlVersions??=[]).push("3.3.3");var tt=(r,t,e)=>{let i=e?.renderBefore??t,s=i._$litPart$;if(s===void 0){let n=e?.renderBefore??null;i._$litPart$=s=new W(t.insertBefore(j(),n),n,void 0,e??{})}return s._$AI(r),s};var ve=globalThis,u=class extends k{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=tt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return L}};u._$litElement$=!0,u.finalized=!0,ve.litElementHydrateSupport?.({LitElement:u});var Et=ve.litElementPolyfillSupport;Et?.({LitElement:u});(ve.litElementVersions??=[]).push("4.2.2");var v=g`
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
`;var fe=class extends u{constructor(){super();this._previous=null;this._keydown=e=>{if(e.key==="Escape")e.stopPropagation(),this._close();else if(e.key==="Tab"){let i=[...this.renderRoot.querySelectorAll("button, [href]"),...this.querySelectorAll("button, [href], input, select, textarea, summary")].filter(d=>!d.hasAttribute("disabled"));if(i.length===0)return;let s=i[0],n=i[i.length-1],o=this.getRootNode().activeElement;e.shiftKey&&(o===s||o===this)?(e.preventDefault(),n.focus()):!e.shiftKey&&o===n&&(e.preventDefault(),s.focus())}};this.heading="",this.closeLabel="Schlie\xDFen",this.wide=!1}static{this.properties={heading:{type:String},closeLabel:{type:String},wide:{type:Boolean}}}static{this.styles=[v,g`
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
    `]}connectedCallback(){super.connectedCallback(),this._previous=document.activeElement,this.addEventListener("keydown",this._keydown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._keydown),this._previous?.focus?.()}firstUpdated(){(this.querySelector("input, textarea, select")??this.renderRoot.querySelector(".dialog"))?.focus()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}render(){return a`
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
    `}};customElements.define("ot-dialog",fe);var _e=class extends u{static{this.properties={heading:{type:String},message:{type:String},confirmLabel:{type:String},cancelLabel:{type:String},danger:{type:Boolean}}}constructor(){super(),this.heading="",this.message="",this.confirmLabel="OK",this.cancelLabel="Abbrechen",this.danger=!1}static{this.styles=[v,g`p { margin: 0; white-space: pre-line; line-height: 1.5; }`]}_fire(t){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0}))}render(){return a`
      <ot-dialog .heading=${this.heading} @close=${()=>this._fire("cancel")}>
        <p>${this.message}</p>
        <button slot="footer" class="btn text" @click=${()=>this._fire("cancel")}>${this.cancelLabel}</button>
        <button slot="footer" class="btn ${this.danger?"danger":"primary"}" @click=${()=>this._fire("confirm")}>${this.confirmLabel}</button>
      </ot-dialog>
    `}};customElements.define("ot-confirm",_e);var be=class extends u{static{this.properties={path:{attribute:!1},rootLabel:{type:String},current:{type:Boolean}}}constructor(){super(),this.path=[],this.rootLabel="Start",this.current=!1}static{this.styles=[v,g`
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
    `]}_go(t){this.dispatchEvent(new CustomEvent("open-node",{detail:t,bubbles:!0,composed:!0}))}render(){let t=this.current?this.path.slice(0,-1):this.path;return a`
      <nav aria-label="Pfad">
        <button @click=${()=>this._go(null)}>${this.rootLabel}</button>
        ${t.map(e=>a`
            <ha-icon class="sep" icon="mdi:chevron-right"></ha-icon>
            <button @click=${()=>this._go(e.id)}>${e.name}</button>
          `)}
        ${this.current&&this.path.length?a`<ha-icon class="sep" icon="mdi:chevron-right"></ha-icon><span class="here" aria-current="page">${this.path[this.path.length-1].name}</span>`:""}
      </nav>
    `}};customElements.define("ot-path",be);var St={place:"mdi:door",furniture:"mdi:bookshelf",container:"mdi:package-variant",group:"mdi:shape",item:"mdi:circle-small"};function b(r){return r.icon||St[r.class]}function ee(r){if(r.quantity===null||r.quantity===void 0)return"";let t=Number.isInteger(r.quantity)?String(r.quantity):String(Math.round(r.quantity*100)/100);return r.unit?`${t} ${r.unit}`:`${t}\xD7`}function te(r){switch(r.code){case"missing":case"expired":case"defective":return"error";case"below_min":case"expiring":return"warning";default:return"info"}}function C(r,t=!0){return(t?r:r.slice(0,-1)).map(i=>i.name).join(" \u203A ")}function E(r,t){if(!r)return"";let e=new Date(r.length===10?`${r}T12:00:00`:r);return Number.isNaN(e.getTime())?r:new Intl.DateTimeFormat(t,{dateStyle:"medium"}).format(e)}function it(r,t,e,i){let s=r.value;return s==null||s===""?"":r.type==="bool"?s?e:i:r.type==="date"?E(String(s),t):r.type==="number"&&r.unit?`${s} ${r.unit}`:String(s)}function ye(r){let t=r.trim().replace(",",".");if(t==="")return null;let e=Number(t);return Number.isFinite(e)?e:void 0}function Q(r){return r.split(/[,\n]/).map(t=>t.trim()).filter(Boolean)}function D(r){let t=/^\s*#?\s*(\d+)\s*$/.exec(r);return t?Number.parseInt(t[1],10):null}function st(r,t,e){let i=new Blob([t],{type:`${e};charset=utf-8`}),s=URL.createObjectURL(i),n=document.createElement("a");n.href=s,n.download=r,document.body.appendChild(n),n.click(),n.remove(),setTimeout(()=>URL.revokeObjectURL(s),1e4)}var At=450,Ct=10,xe=100,$e=class extends u{constructor(){super();this.texts={selected:"ausgew\xE4hlt",items:"Eintr\xE4ge"};this._origin=null;this._suppressClick=!1;this.rows=[],this.selection=null,this.selectable=!1,this.showCounts=!0,this.label="",this._limit=xe}static{this.properties={rows:{attribute:!1},selection:{attribute:!1},selectable:{type:Boolean},showCounts:{type:Boolean},label:{type:String},_limit:{state:!0}}}static{this.styles=[v,g`
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
    `]}willUpdate(e){e.has("rows")&&(this._limit=xe)}updated(){this._observer?.disconnect();let e=this.renderRoot.querySelector(".sentinel");e&&typeof IntersectionObserver<"u"&&(this._observer=new IntersectionObserver(i=>{i.some(s=>s.isIntersecting)&&(this._limit+=xe)}),this._observer.observe(e))}disconnectedCallback(){super.disconnectedCallback(),this._observer?.disconnect(),clearTimeout(this._timer)}_fire(e,i){this.dispatchEvent(new CustomEvent(e,{detail:i,bubbles:!0,composed:!0}))}_down(e,i){!this.selectable||e.button!==0||(this._origin={x:e.clientX,y:e.clientY},clearTimeout(this._timer),this._timer=setTimeout(()=>{this._suppressClick=!0,this.selection?.start(i),this._changed()},At))}_move(e){this._origin&&Math.hypot(e.clientX-this._origin.x,e.clientY-this._origin.y)>Ct&&this._cancel()}_cancel(){clearTimeout(this._timer),this._origin=null}_click(e){if(this._cancel(),this._suppressClick){this._suppressClick=!1;return}this.selectable&&this.selection?.active?(this.selection.toggle(e),this._changed()):this._fire("open-node",e)}_context(e,i){this.selectable&&(e.preventDefault(),this._cancel(),this.selection?.has(i)||this.selection?.start(i),this._changed())}_key(e,i){e.key!==" "||!this.selectable||!this.selection||(e.preventDefault(),this.selection.active?this.selection.toggle(i):this.selection.start(i),this._changed())}_changed(){this.requestUpdate(),this.dispatchEvent(new CustomEvent("selection-changed",{bubbles:!0,composed:!0}))}render(){let e=this.rows.slice(0,this._limit);return a`
      <div class="list" role="list" aria-label=${this.label}>
        ${e.map(i=>this._row(i))}
        ${this.rows.length>this._limit?a`<div class="sentinel"></div>`:c}
      </div>
    `}_row(e){let i=this.selection?.has(e.id)??!1,s=this.selection?.active??!1;return a`
      <button
        class="item ${i?"selected":""}"
        role="listitem"
        aria-label=${`${e.number!==null?`${e.number} `:""}${e.name}${i?`, ${this.texts.selected}`:""}`}
        @pointerdown=${n=>this._down(n,e.id)}
        @pointermove=${this._move}
        @pointerup=${this._cancel}
        @pointercancel=${this._cancel}
        @pointerleave=${this._cancel}
        @click=${()=>this._click(e.id)}
        @contextmenu=${n=>this._context(n,e.id)}
        @keydown=${n=>this._key(n,e.id)}
      >
        ${s?a`<ha-icon class="icon check" icon=${i?"mdi:checkbox-marked-circle":"mdi:checkbox-blank-circle-outline"}></ha-icon>`:a`<ha-icon class="icon" icon=${e.icon}></ha-icon>`}
        <span class="grow">
          <span class="row">
            ${e.number!==null?a`<span class="badge">${e.number}</span>`:c}
            <span class="title ellipsis ${e.archived?"muted":""}">${e.name}</span>
          </span>
          ${e.subtitle?a`<span class="small muted ellipsis" style="display:block">${e.subtitle}</span>`:c}
          ${e.hints.length?a`<span class="chips">${e.hints.slice(0,2).map(n=>a`<span class="chip ${te(n)}">${n.text}</span>`)}</span>`:c}
        </span>
        ${this.showCounts&&e.counts?a`<span class="counts" title=${`${e.counts[0]} / ${e.counts[1]}`}>${e.counts[0]}${e.counts[1]!==e.counts[0]?` \xB7 ${e.counts[1]}`:""}</span>`:c}
        ${s?c:a`<ha-icon class="icon" icon="mdi:chevron-right"></ha-icon>`}
      </button>
    `}};customElements.define("ot-node-list",$e);function h(r){return r instanceof Error?r.message:String(r)}var we=class extends u{constructor(){super();this._numberTouched=!1;this._nextNumber=null;this.mode="create",this.parentId=null,this.node=null,this._name="",this._kind="",this._number="",this._aliases="",this._tags="",this._owner="",this._quantity="",this._unit="",this._minQuantity="",this._note="",this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},mode:{type:String},parentId:{attribute:!1},node:{attribute:!1},_name:{state:!0},_kind:{state:!0},_number:{state:!0},_aliases:{state:!0},_tags:{state:!0},_owner:{state:!0},_quantity:{state:!0},_unit:{state:!0},_minQuantity:{state:!0},_note:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[v,g`
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
    `]}async connectedCallback(){super.connectedCallback();let e=this.node;if(this.mode==="edit"&&e)this._name=e.name,this._kind=e.kind,this._number=e.number!==null?String(e.number):"",this._numberTouched=!0,this._aliases=e.aliases.join(", "),this._tags=e.tags.join(", "),this._owner=e.owner??"",this._quantity=e.quantity!==null?String(e.quantity):"",this._unit=e.unit,this._minQuantity=e.min_quantity!==null?String(e.min_quantity):"",this._note=e.note;else try{let i=await this.ctx.api.suggest(this.parentId);this._nextNumber=i.next_number,this._kind=i.kinds[0]??this.ctx.catalog?.kinds[0]?.id??"",this._syncNumber()}catch(i){this._error=h(i)}}get _kinds(){return this.ctx.catalog?.kinds??[]}get _numbered(){return this._kinds.find(e=>e.id===this._kind)?.numbered??!1}_syncNumber(){this.mode==="edit"||this._numberTouched||(this._number=this._numbered&&this._nextNumber!==null?String(this._nextNumber):"")}_input(e){return i=>{this[e]=i.target.value}}async _save(e){e?.preventDefault();let i=this.ctx.t,s=this._name.trim();if(!s){this._error=i("form.nameRequired");return}let n=ye(this._quantity),o=ye(this._minQuantity),d=this._number.trim()===""?null:Number.parseInt(this._number,10);if(n===void 0||o===void 0||d!==null&&!(d>=1)){this._error=i("form.numberInvalid");return}this._busy=!0,this._error="";try{if(this.mode==="create"){let l={name:s,kind:this._kind,aliases:Q(this._aliases),tags:Q(this._tags),note:this._note,unit:this._unit};this.parentId&&(l.parent=this.parentId),d!==null&&(l.number=d),this._owner&&(l.owner=this._owner),n!==null&&(l.quantity=n),o!==null&&(l.min_quantity=o);let m=await this.ctx.api.create(l);this._done("created",m.id,s)}else this.node&&(await this.ctx.api.update(this.node.id,{name:s,kind:this._kind,number:d,aliases:Q(this._aliases),tags:Q(this._tags),note:this._note,owner:this._owner||null,quantity:n,unit:this._unit,min_quantity:o}),this._done("saved",this.node.id,s))}catch(l){this._error=h(l)}finally{this._busy=!1}}_done(e,i,s){this.dispatchEvent(new CustomEvent("saved",{detail:{kind:e,id:i,name:s},bubbles:!0,composed:!0}))}render(){let e=this.ctx.t,i=this.ctx.catalog?.persons??[],s=this.node?.effective_owner?.inherited?this.node.effective_owner.name:"",n=this.mode==="create"?e("form.createTitle"):e("form.editTitle");return a`
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
                ${this._kinds.map(o=>a`<option value=${o.id} ?selected=${o.id===this._kind}>${o.name}</option>`)}
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
                  ${i.map(o=>a`<option value=${o.id} ?selected=${o.id===this._owner}>${o.name}</option>`)}
                </select>
              </label>
              <div class="two">
                <label class="field">${e("form.quantity")}<input inputmode="decimal" .value=${this._quantity} @input=${this._input("_quantity")} /></label>
                <label class="field">${e("form.unit")}<input .value=${this._unit} @input=${this._input("_unit")} /></label>
              </div>
              <label class="field">${e("form.minQuantity")}<input inputmode="decimal" .value=${this._minQuantity} @input=${this._input("_minQuantity")} /></label>
              <label class="field">${e("form.note")}<textarea rows="3" .value=${this._note} @input=${this._input("_note")}></textarea></label>
            </div>
          </details>
          ${this._error?a`<div class="error-text" role="alert">${this._error}</div>`:c}
        </form>
        <button slot="footer" class="btn text" @click=${()=>this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}>${e("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${()=>this._save()}>${e("common.save")}</button>
      </ot-dialog>
    `}};customElements.define("ot-node-form",we);var _=class{constructor(){this.seq=0}async run(t){let e=++this.seq,i=await t();return e===this.seq?i:void 0}cancel(){this.seq++}};function $(r,t){let e,i=(...s)=>{clearTimeout(e),e=setTimeout(()=>r(...s),t)};return i.cancel=()=>clearTimeout(e),i.flush=(...s)=>{clearTimeout(e),r(...s)},i}var Tt=250,ke=class extends u{constructor(){super();this._latest=new _;this._refresh=$(async()=>{if(!this._text.trim()){this._latest.cancel(),this._preview=null;return}try{let e=await this._latest.run(()=>this.ctx.api.quickPreview(this._text,this._commas));e&&(this._preview=e,this._error="")}catch(e){this._error=h(e)}},Tt);this.parentId="",this.parentName="",this._text="",this._commas=!1,this._preview=null,this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},parentId:{type:String},parentName:{type:String},_text:{state:!0},_commas:{state:!0},_preview:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[v,g`
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
    `]}disconnectedCallback(){super.disconnectedCallback(),this._refresh.cancel(),this._latest.cancel()}_edit(e,i=this._commas){this._text=e,this._commas=i,this._refresh()}async _apply(){if(this._preview?.count){this._busy=!0;try{let e=await this.ctx.api.quickApply(this.parentId,this._text,this._commas);this.dispatchEvent(new CustomEvent("saved",{detail:{count:e.created.length},bubbles:!0,composed:!0}))}catch(e){this._error=h(e)}finally{this._busy=!1}}}render(){let e=this.ctx.t,i=this._preview?.count??0;return a`
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
          ${this._preview&&i>0?a`
                <div>
                  <h3>${e("quick.preview",{n:i})}</h3>
                  <ul class="preview" aria-live="polite">
                    ${this._preview.preview.map(s=>a`<li style="white-space:pre">${s}</li>`)}
                  </ul>
                </div>
              `:c}
          ${this._error?a`<div class="error-text" role="alert">${this._error}</div>`:c}
        </div>
        <button slot="footer" class="btn text" @click=${()=>this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}>${e("common.cancel")}</button>
        <button slot="footer" class="btn primary" ?disabled=${this._busy||i===0} @click=${this._apply}>${e("quick.apply",{n:i})}</button>
      </ot-dialog>
    `}};customElements.define("ot-quickadd",ke);var Pt="unsortiert",nt="papierkorb",Ee=class extends u{constructor(){super();this._latest=new _;this._search=$(async()=>{let e=this._query.trim();if(!e){this._latest.cancel(),this._results=null;return}try{let i=await this._latest.run(async()=>{let s=D(e),n=[];if(s!==null)try{let d=await this.ctx.api.byNumber(s);n.push({...this._fromBrief(d,C(d.path,!1)),hasChildren:d.children>0})}catch{}let o=await this.ctx.api.search(e,{classes:["place","furniture","container","group"]},30);for(let d of o.hits){if(n.some(m=>m.id===d.id))continue;let l=this.ctx.catalog?.kinds.find(m=>m.id===d.kind);n.push({id:d.id,name:d.name,icon:b({icon:l?.icon??"",class:d.class}),number:d.number,subtitle:C(d.path,!1),hasChildren:!1})}return n});i&&(this._results=i)}catch(i){this._error=h(i)}},200);this.ids=[],this.startAt="",this._query="",this._results=null,this._browse={path:[],options:[]},this._recent=[],this._target=null,this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},ids:{attribute:!1},startAt:{type:String},_query:{state:!0},_results:{state:!0},_browse:{state:!0},_recent:{state:!0},_target:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[v,g`
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
    `]}async connectedCallback(){super.connectedCallback();try{let e=await this.ctx.api.user();this._recent=e.targets.filter(i=>!this.ids.includes(i.id)).map(i=>this._fromBrief(i))}catch{}await this._open(this.startAt||null)}disconnectedCallback(){super.disconnectedCallback(),this._latest.cancel(),this._search.cancel()}_fromBrief(e,i=""){return{id:e.id,name:e.name,icon:b(e),number:e.number,subtitle:i||e.kind_name,hasChildren:e.children>0}}async _open(e){try{let i=await this.ctx.api.node(e);if(e===null)this._browse={path:[],options:i.contents.filter(s=>s.id!==nt).map(s=>this._fromBrief(s))};else{let s=i;this._browse={path:s.path,options:s.contents.filter(n=>n.class!=="item").map(n=>this._fromBrief(n))}}}catch(i){this._error=h(i)}}_choose(e){this._target={id:e.id,label:e.subtitle&&e.id!==e.name?`${e.name}`:e.name},this._error=""}_disabled(e){return this.ids.includes(e)||e===nt}async _move(){if(this._target){this._busy=!0,this._error="";try{let e=this._target.id;await this.ctx.api.move(this.ids,e),e&&await this.ctx.api.addTarget(e).catch(()=>{}),this.dispatchEvent(new CustomEvent("saved",{detail:{count:this.ids.length,target:this._target.label},bubbles:!0,composed:!0}))}catch(e){this._error=h(e)}finally{this._busy=!1}}}_opt(e,i){let s=this.ctx.t,n=this._target?.id===e.id;return a`
      <div class="opt ${n?"sel":""}">
        <button class="main" ?disabled=${this._disabled(e.id)} aria-pressed=${n?"true":"false"} @click=${()=>this._choose(e)}>
          <ha-icon class="icon muted" icon=${e.icon}></ha-icon>
          <span class="grow">
            <span class="row">
              ${e.number!==null?a`<span class="badge">${e.number}</span>`:c}
              <span class="ellipsis">${e.name}</span>
            </span>
            <span class="small muted ellipsis" style="display:block">${e.subtitle}</span>
          </span>
        </button>
        ${i&&e.hasChildren&&!this._disabled(e.id)?a`<button class="down" aria-label=${s("move.open",{name:e.name})} @click=${()=>this._open(e.id)}><ha-icon icon="mdi:chevron-right"></ha-icon></button>`:c}
      </div>
    `}render(){let e=this.ctx.t,i=this.ids.length,s=this._browse.path[this._browse.path.length-1];return a`
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
          ${this._results!==null?a`
                <div class="list">
                  ${this._results.length?this._results.map(n=>this._opt(n,!1)):a`<div class="empty">${e("search.none")}</div>`}
                </div>
              `:a`
                ${this._recent.length?a`<div>
                      <h3>${e("move.recent")}</h3>
                      <div class="list" style="margin-top:6px">${this._recent.map(n=>this._opt(n,!1))}</div>
                    </div>`:c}
                <div>
                  <h3>${e("move.browse")}</h3>
                  <ot-path
                    .path=${this._browse.path}
                    .rootLabel=${e("common.start")}
                    current
                    @open-node=${n=>this._open(n.detail)}
                  ></ot-path>
                  <div class="row wrap" style="margin:6px 0">
                    ${s?a`<button class="btn" ?disabled=${this._disabled(s.id)} @click=${()=>this._choose({id:s.id,name:s.name,icon:"",number:null,subtitle:"",hasChildren:!1})}>${e("move.chooseHere",{name:s.name})}</button>`:a`<button class="btn" @click=${()=>this._target={id:null,label:e("move.topLevel")}}>${e("move.topLevel")}</button>
                          <button class="btn" @click=${()=>this._target={id:Pt,label:e("overview.unsorted")}}>${e("overview.unsorted")}</button>`}
                  </div>
                  <div class="list">
                    ${this._browse.options.length?this._browse.options.map(n=>this._opt(n,!0)):a`<div class="empty small">${e("move.nothingBelow")}</div>`}
                  </div>
                </div>
              `}
          ${this._error?a`<div class="error-text" role="alert">${this._error}</div>`:c}
        </div>
        <span slot="footer" class="grow target ellipsis">${this._target?e("move.target",{name:this._target.label}):e("move.noTarget")}</span>
        <button slot="footer" class="btn primary" ?disabled=${this._busy||!this._target} @click=${this._move}>${e("move.do")}</button>
      </ot-dialog>
    `}};customElements.define("ot-move",Ee);function H(r,t=""){let e=[r.kind_name,ee(r),t].filter(Boolean),i=r.class!=="item";return{id:r.id,name:r.name,icon:b(r),number:r.number,subtitle:e.join(" \xB7 "),hints:r.hints,counts:i?[r.children,r.descendants]:null,archived:r.archived,class:r.class}}function rt(r,t,e){return{id:r.id,name:r.name,icon:b({icon:e,class:r.class}),number:r.number,subtitle:[t,C(r.path,!1)].filter(Boolean).join(" \xB7 "),hints:r.hints,counts:null,archived:r.archived,class:r.class}}var ie=class{constructor(){this.ids=new Set;this.active=!1}get size(){return this.ids.size}has(t){return this.ids.has(t)}values(){return[...this.ids]}start(t){this.active=!0,this.ids.add(t)}toggle(t){this.ids.has(t)?this.ids.delete(t):this.ids.add(t),this.ids.size===0&&(this.active=!1)}selectAll(t){this.active=t.length>0,this.ids=new Set(t)}clear(){this.ids.clear(),this.active=!1}retain(t){let e=new Set(t);for(let i of[...this.ids])e.has(i)||this.ids.delete(i);this.ids.size===0&&(this.active=!1)}};var Rt=["unsortiert","papierkorb"],Se=class extends u{constructor(){super();this._selection=new ie;this._latest=new _;this._loaded=null;this._closeDialog=()=>{this._dialog=null};this._saved=e=>{let i=this.ctx.t,s=e.detail;this._dialog=null,s.kind==="created"?this.ctx.toast(i("form.created",{name:s.name??""})):s.kind==="saved"?this.ctx.toast(i("form.saved")):s.target!==void 0?(this.ctx.toast(i("move.done",{n:s.count??0,name:s.target})),this._selection.clear()):this.ctx.toast(i("quick.done",{n:s.count??0})),this._load()};this.nodeId=null,this._data=null,this._error="",this._dialog=null,this._moveIds=[],this._deleteMode="trash",this._favorite=!1,this._menu=!1}static{this.properties={ctx:{attribute:!1},nodeId:{attribute:!1},_data:{state:!0},_error:{state:!0},_dialog:{state:!0},_moveIds:{state:!0},_deleteMode:{state:!0},_favorite:{state:!0},_menu:{state:!0}}}static{this.styles=[v,g`
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
    `]}willUpdate(e){let i=this.ctx?.revision??0;if(!this._loaded||e.has("nodeId")||this._loaded.revision!==i){let s=this._loaded?.id===this.nodeId;this._loaded={id:this.nodeId,revision:i},s||(this._selection.clear(),this._menu=!1),this._load()}}async _load(){try{let e=this.nodeId,i=await this._latest.run(()=>this.ctx.api.node(e,{track:!0}));if(!i)return;if(this._data=i,this._error="",this._selection.retain(i.contents.map(s=>s.id)),e){let s=await this.ctx.api.user().catch(()=>null);this._favorite=!!s?.favorites.includes(e)}}catch(e){this._data=null,this._error=h(e)}}get _detail(){return this._data&&this._data.id!==null?this._data:null}_open(e){this.ctx.go({page:"node",id:e})}async _toggleFavorite(){let e=this._detail;if(e)try{await this.ctx.api.favorite(e.id,!this._favorite),this._favorite=!this._favorite}catch(i){this.ctx.toast(h(i),"error")}}async _restore(){let e=this._detail;if(e)try{await this.ctx.api.restore(e.id),this.ctx.toast(this.ctx.t("trash.restored",{name:e.name}))}catch(i){this.ctx.toast(h(i),"error")}}async _deleteSelected(){let e=this._selection.values(),i=this.ctx.t;if(await this.ctx.confirm({title:i("delete.manyTitle",{n:e.length}),message:i("delete.manyMessage",{n:e.length}),confirmLabel:i("common.delete"),danger:!0}))try{for(let n of e)await this.ctx.api.remove(n,"trash");this._selection.clear(),this.ctx.toast(i("delete.done",{n:e.length}))}catch(n){this.ctx.toast(h(n),"error")}}async _deleteOne(){let e=this._detail;if(e)try{await this.ctx.api.remove(e.id,this._deleteMode),this._dialog=null,this.ctx.toast(this.ctx.t("delete.doneOne",{name:e.name})),this._open(e.parent)}catch(i){this._dialog=null,this.ctx.toast(h(i),"error")}}render(){let e=this.ctx.t;if(this._error&&!this._data)return a`<div class="empty"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><p role="alert">${this._error}</p>
        <button class="btn" @click=${()=>this._open(null)}>${e("common.start")}</button></div>`;if(!this._data)return a`<div class="empty muted">${e("common.loading")}</div>`;let i=this._detail,s=this._data.contents.map(l=>H(l)),n=i?Rt.includes(i.id):!1,o=i?.in_trash??!1,d=!o&&i?.id!=="papierkorb";return a`
      ${i?a`<ot-path .path=${i.path} .rootLabel=${e("common.start")} current @open-node=${l=>this._open(l.detail)}></ot-path>`:c}
      ${this._head(i,n)}
      ${i&&o?this._trashBanner(i):c}
      ${d?a`
        <div class="actions">
          <button class="btn primary" @click=${()=>this._dialog="create"}><ha-icon icon="mdi:plus"></ha-icon>${e("node.new")}</button>
          ${i?a`<button class="btn" @click=${()=>this._dialog="quick"}><ha-icon icon="mdi:text-box-plus-outline"></ha-icon>${e("node.quick")}</button>`:c}
          ${s.length>1?a`<button class="btn text" @click=${()=>{this._selection.selectAll(s.map(l=>l.id)),this.requestUpdate()}}><ha-icon icon="mdi:select-all"></ha-icon>${e("node.selectAll")}</button>`:c}
        </div>`:c}
      ${i?this._info(i):c}
      <div class="section-title">${e("node.contents")}${s.length?` (${s.length})`:""}</div>
      ${s.length?a`<ot-node-list
            .rows=${s}
            .selection=${this._selection}
            .selectable=${!o}
            .label=${e("node.contents")}
            @open-node=${l=>this._open(l.detail)}
            @selection-changed=${()=>this.requestUpdate()}
          ></ot-node-list>`:this._empty(i)}
      ${this._selection.active?this._selectionBar():c}
      ${this._dialogs(i)}
    `}_head(e,i){let s=this.ctx.t;return e?a`
      <div class="head">
        <ha-icon icon=${b(e)}></ha-icon>
        ${e.number!==null?a`<span class="badge">${e.number}</span>`:c}
        <h1 class="grow">${e.name}</h1>
        ${!i&&!e.in_trash?a`<button class="icon-btn" aria-label=${this._favorite?s("node.unfavorite"):s("node.favorite")} aria-pressed=${this._favorite?"true":"false"} @click=${this._toggleFavorite}>
              <ha-icon icon=${this._favorite?"mdi:star":"mdi:star-outline"} style=${this._favorite?"color: var(--warning-color, #ffa600)":""}></ha-icon>
            </button>
            <div class="menu">
              <button class="icon-btn" aria-label=${s("node.more")} aria-haspopup="true" aria-expanded=${this._menu?"true":"false"} @click=${()=>this._menu=!this._menu}><ha-icon icon="mdi:dots-vertical"></ha-icon></button>
              ${this._menu?a`<div class="pop" role="menu">
                <button role="menuitem" @click=${()=>{this._menu=!1,this._dialog="edit"}}><ha-icon icon="mdi:pencil"></ha-icon>${s("common.edit")}</button>
                <button role="menuitem" @click=${()=>{this._menu=!1,this._moveIds=[e.id],this._dialog="move"}}><ha-icon icon="mdi:folder-move-outline"></ha-icon>${s("common.move")}</button>
                <button role="menuitem" @click=${()=>{this._menu=!1,this._deleteMode="trash",this._dialog="delete"}}><ha-icon icon="mdi:delete-outline"></ha-icon>${s("common.delete")}</button>
              </div>`:c}
            </div>`:c}
      </div>
    `:a`<div class="head"><ha-icon icon="mdi:home-variant-outline"></ha-icon><h1 class="grow">${s("node.rootTitle")}</h1>
        <a class="btn text" href="#" @click=${n=>{n.preventDefault(),this.ctx.go({page:"trash"})}}><ha-icon icon="mdi:delete-outline"></ha-icon>${s("nav.trash")}</a></div>`}_trashBanner(e){let i=this.ctx.t,s=e.parent==="papierkorb";return a`<div class="banner">
      <ha-icon icon="mdi:delete-clock-outline"></ha-icon>
      <span class="grow">${s?i("trash.bannerTop",{date:e.trashed?E(e.trashed.at.slice(0,10),this.ctx.lang):""}):i("trash.bannerInside")}</span>
      ${s?a`<button class="btn" @click=${this._restore}>${i("trash.restore")}</button>`:c}
    </div>`}_info(e){let i=this.ctx.t,s=this.ctx.lang,n=[];n.push([i("node.kind"),e.kind_name]),e.effective_owner&&n.push([i("node.owner"),e.effective_owner.inherited?`${e.effective_owner.name} (${i("node.inherited")})`:e.effective_owner.name]);let o=ee(e);o&&n.push([i("node.quantity"),e.min_quantity!==null?`${o} (${i("node.minimum")} ${e.min_quantity})`:o]),e.aliases.length&&n.push([i("node.aliases"),e.aliases.join(", ")]),e.tags.length&&n.push([i("node.tags"),a`${e.tags.map(p=>a`<span class="chip" style="margin-right:4px">${p}</span>`)}`]);let d=e.effective_checkout;if(d){let p=d.type==="lent"?i("node.lentTo"):i("node.outAt"),f=`${d.to} \xB7 ${i("node.since")} ${E(d.since,s)}${d.until?` \xB7 ${i("node.until")} ${E(d.until,s)}`:""}`;n.push([p,d.inherited?`${f} (${i("node.viaContainer")})`:f])}e.condition!=="ok"&&n.push([i("node.condition"),i(`condition.${e.condition}`)]),e.note&&n.push([i("node.note"),a`<span style="white-space:pre-wrap">${e.note}</span>`]);let l=e.fields.filter(p=>p.value!==null&&p.value!==void 0&&p.value!=="");if(n.length<=1&&l.length===0&&e.hints.length===0)return c;let m="";return a`
      <div class="card">
        ${e.hints.length?a`<div class="row wrap" style="margin-bottom:10px">${e.hints.map(p=>a`<span class="chip ${te(p)}">${p.text}</span>`)}</div>`:c}
        <dl>
          ${n.map(([p,f])=>a`<dt>${p}</dt><dd>${f}</dd>`)}
          ${l.map(p=>{let f=p.group!==m&&p.group?a`<div class="group-name">${p.group}</div>`:c;return m=p.group,a`${f}<dt>${p.name}</dt><dd class=${p.assigned?"":"dim"} title=${p.assigned?"":i("node.unassigned")}>${it(p,s,i("common.yes"),i("common.no"))}${p.assigned?"":` (${i("node.unassigned")})`}</dd>`})}
        </dl>
      </div>
    `}_empty(e){let i=this.ctx.t;if(e?.in_trash)return a`<div class="empty small">${i("node.emptyTrashed")}</div>`;let s=e?e.class==="place"?"node.emptyPlace":e.class==="container"?"node.emptyContainer":e.class==="item"?"node.emptyItem":"node.emptyGeneric":"node.emptyRoot";return a`<div class="empty"><ha-icon icon="mdi:package-variant-closed"></ha-icon><p>${i(s)}</p></div>`}_selectionBar(){let e=this.ctx.t,i=this._selection.size;return a`<div class="selbar" role="toolbar" aria-label=${e("node.selection")}>
      <span class="grow">${e("node.selected",{n:i})}</span>
      <button class="btn" @click=${()=>{this._moveIds=this._selection.values(),this._dialog="move"}}><ha-icon icon="mdi:folder-move-outline"></ha-icon>${e("common.move")}</button>
      <button class="btn danger" @click=${this._deleteSelected}><ha-icon icon="mdi:delete-outline"></ha-icon>${e("common.delete")}</button>
      <button class="icon-btn" aria-label=${e("common.cancel")} @click=${()=>{this._selection.clear(),this.requestUpdate()}}><ha-icon icon="mdi:close"></ha-icon></button>
    </div>`}_dialogs(e){let i=this.ctx.t;switch(this._dialog){case"create":return a`<ot-node-form .ctx=${this.ctx} mode="create" .parentId=${e?.id??null} @saved=${this._saved} @close=${this._closeDialog}></ot-node-form>`;case"edit":return e?a`<ot-node-form .ctx=${this.ctx} mode="edit" .node=${e} @saved=${this._saved} @close=${this._closeDialog}></ot-node-form>`:c;case"quick":return e?a`<ot-quickadd .ctx=${this.ctx} .parentId=${e.id} .parentName=${e.name} @saved=${this._saved} @close=${this._closeDialog}></ot-quickadd>`:c;case"move":return a`<ot-move .ctx=${this.ctx} .ids=${this._moveIds} .startAt=${e?.id??""} @saved=${this._saved} @close=${this._closeDialog}></ot-move>`;case"delete":return e?this._deleteDialog(e,i):c;default:return c}}_deleteDialog(e,i){let s=e.descendants;return a`
      <ot-dialog .heading=${i("delete.title",{name:e.name})} .closeLabel=${i("common.close")} @close=${this._closeDialog}>
        <p style="margin-top:0">${s>0?i("delete.withContent",{n:s}):i("delete.empty")}</p>
        ${s>0?a`
              <label class="radio"><input type="radio" name="mode" .checked=${this._deleteMode==="trash"} @change=${()=>this._deleteMode="trash"} /><span>${i("delete.modeTrash",{n:s})}</span></label>
              <label class="radio"><input type="radio" name="mode" .checked=${this._deleteMode==="lift"} @change=${()=>this._deleteMode="lift"} /><span>${i("delete.modeLift")}</span></label>
            `:c}
        <p class="small muted">${i("delete.trashInfo",{days:this.ctx.catalog?.settings.trash_days??30})}</p>
        <button slot="footer" class="btn text" @click=${this._closeDialog}>${i("common.cancel")}</button>
        <button slot="footer" class="btn danger" @click=${this._deleteOne}>${i("common.delete")}</button>
      </ot-dialog>
    `}};customElements.define("ot-node-page",Se);var Ae=class extends u{constructor(){super();this._latest=new _;this._revision=-1;this._data=null,this._error="",this._busy=!1}static{this.properties={ctx:{attribute:!1},_data:{state:!0},_error:{state:!0},_busy:{state:!0}}}static{this.styles=[v,g`
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
    `]}willUpdate(){let e=this.ctx?.revision??0;this._revision!==e&&(this._revision=e,this._load())}async _load(){try{let e=await this._latest.run(()=>this.ctx.api.overview());e&&(this._data=e,this._error="")}catch(e){this._error=h(e)}}_open(e){this.ctx.go({page:"node",id:e})}async _sample(e){this._busy=!0;try{if(e)await this.ctx.api.sampleLoad();else{if(!await this.ctx.confirm({title:this.ctx.t("sample.removeTitle"),message:this.ctx.t("sample.removeMessage"),confirmLabel:this.ctx.t("sample.remove"),danger:!0}))return;await this.ctx.api.sampleRemove()}this.ctx.toast(this.ctx.t(e?"sample.loaded":"sample.removed")),await this.ctx.reloadCatalog()}catch(i){this.ctx.toast(h(i),"error")}finally{this._busy=!1}}render(){let e=this.ctx.t;if(this._error&&!this._data)return a`<div class="empty error-text" role="alert">${this._error}</div>`;let i=this._data;if(!i)return a`<div class="empty muted">${e("common.loading")}</div>`;let s=i.overview,n=Object.entries(s.due).filter(([l])=>l!=="below_min").reduce((l,[,m])=>l+m,0),o=this.ctx.status?.inventory_empty??!1,d=s.total_value;return a`
      ${o&&!this.ctx.catalog?.sample_loaded?a`<div class="card intro">
            <ha-icon icon="mdi:package-variant"></ha-icon>
            <h2>${e("overview.welcome")}</h2>
            <p class="muted" style="margin:0;max-width:34em">${e("overview.welcomeText")}</p>
            <div class="row wrap" style="justify-content:center">
              <button class="btn primary" @click=${()=>this.ctx.go({page:"node",id:null})}>${e("overview.start")}</button>
              <button class="btn" ?disabled=${this._busy} @click=${()=>this._sample(!0)}>${e("sample.load")}</button>
            </div>
          </div>`:c}
      <div class="tiles" style="margin-top:12px">
        ${this._tile(String(s.containers),e("overview.containers"),()=>this.ctx.go({page:"search",query:"",filters:{classes:["container"]}}))}
        ${this._tile(String(s.items),e("overview.items"),()=>this.ctx.go({page:"search",query:"",filters:{classes:["item"]}}))}
        ${this._tile(String(s.unsorted),e("overview.unsorted"),()=>this._open("unsortiert"),s.unsorted>0?"alert":"")}
        ${this._tile(String(s.checked_out),e("overview.checkedOut"),()=>this.ctx.go({page:"search",query:"",filters:{checked_out:!0}}),s.checked_out_overdue>0?"alert":"")}
        ${this._tile(String(n),e("overview.due"),()=>this.ctx.go({page:"due"}),n>0?"alert":"")}
        ${this._tile(String(s.due.below_min??0),e("overview.restock"),()=>this.ctx.go({page:"due"}),(s.due.below_min??0)>0?"alert":"")}
      </div>
      <div class="row wrap muted small" style="margin:12px 4px 0;gap:16px">
        <span><ha-icon icon="mdi:numeric" style="--mdc-icon-size:18px"></ha-icon> ${e("overview.nextNumber",{n:s.next_free_number})}</span>
        ${d!==null?a`<span><ha-icon icon="mdi:cash" style="--mdc-icon-size:18px"></ha-icon> ${e("overview.value",{value:this._money(d)})}</span>`:c}
        <a href="#" @click=${l=>{l.preventDefault(),this.ctx.go({page:"trash"})}}>${e("nav.trash")}</a>
      </div>
      ${Object.keys(s.value_per_place).length?a`<div class="small muted" style="margin:6px 4px 0">${Object.entries(s.value_per_place).map(([l,m])=>`${l}: ${this._money(m)}`).join(" \xB7 ")}</div>`:c}
      ${this._section(e("overview.favorites"),i.favorites,e("overview.favoritesEmpty"))}
      ${this._section(e("overview.recent"),i.recent,e("overview.recentEmpty"))}
      ${s.empty_containers.length?this._section(e("overview.emptyContainers"),s.empty_containers,""):c}
      ${this.ctx.catalog?.sample_loaded?a`<div class="row" style="margin-top:20px"><span class="muted small grow">${e("sample.active")}</span><button class="btn text" ?disabled=${this._busy} @click=${()=>this._sample(!1)}>${e("sample.remove")}</button></div>`:c}
    `}_money(e){return new Intl.NumberFormat(this.ctx.lang,{style:"currency",currency:"EUR"}).format(e)}_tile(e,i,s,n=""){return a`<button class="tile ${n}" @click=${s}><span class="n">${e}</span><span class="l">${i}</span></button>`}_section(e,i,s){return a`
      <div class="section-title">${e}</div>
      ${i.length?a`<ot-node-list .rows=${i.map(n=>H(n))} .label=${e} @open-node=${n=>this._open(n.detail)}></ot-node-list>`:s?a`<div class="small muted" style="margin:0 4px">${s}</div>`:c}
    `}};customElements.define("ot-overview",Ae);var at=["place","furniture","container","group","item"],Lt=["checked_out","has_number","empty","stale","include_archived"],Dt={checked_out:"search.fOut",has_number:"search.fNumber",empty:"search.fEmpty",stale:"search.fStale",include_archived:"search.fArchived"},Ce=class extends u{constructor(){super();this._latest=new _;this._key="";this.query="",this.filters={},this._hits=null,this._total=0,this._numberHit=null,this._loading=!1,this._error="",this._open=!1}static{this.properties={ctx:{attribute:!1},query:{type:String},filters:{attribute:!1},_hits:{state:!0},_total:{state:!0},_numberHit:{state:!0},_loading:{state:!0},_error:{state:!0},_open:{state:!0}}}static{this.styles=[v,g`
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
    `]}willUpdate(){let e=JSON.stringify([this.query,this.filters,this.ctx?.revision]);e!==this._key&&(this._key=e,this._run())}async _run(){this._loading=!0;try{let e=await this._latest.run(()=>this.ctx.api.search(this.query,this.filters,200));if(!e)return;this._hits=e.hits,this._total=e.total,this._numberHit=e.number_hit,this._error="",this._loading=!1}catch(e){this._error=h(e),this._loading=!1}}_set(e){let i={...this.filters,...e};for(let s of Object.keys(i)){let n=i[s];(n===void 0||n===""||Array.isArray(n)&&n.length===0||n===!1)&&delete i[s]}this.ctx.go({page:"search",query:this.query,filters:i},{replace:!0})}_toggleClass(e){let i=new Set(this.filters.classes??[]);i.has(e)?i.delete(e):i.add(e),this._set({classes:at.filter(s=>i.has(s))})}get _activeCount(){let e=this.filters;return Object.keys(e).filter(i=>!(i==="checked_out"&&e.checked_out===void 0)).length}render(){let e=this.ctx.t,i=this.filters,s=this.ctx.catalog?.kinds??[],n=this.ctx.catalog?.persons??[],o=(this._hits??[]).map(l=>{let m=s.find(p=>p.id===l.kind);return rt(l,m?.name??"",m?.icon??"")}),d=this._numberHit?this._hits?.find(l=>l.id===this._numberHit):void 0;return a`
      <div class="filters" role="group" aria-label=${e("search.filter")}>
        ${at.map(l=>a`<button class="chip" aria-pressed=${i.classes?.includes(l)?"true":"false"} @click=${()=>this._toggleClass(l)}>${e(`class.${l}`)}</button>`)}
      </div>
      <details class="panel" ?open=${this._open} @toggle=${l=>this._open=l.target.open}>
        <summary><ha-icon icon="mdi:filter-variant"></ha-icon>${e("search.moreFilters")}${this._activeCount?` (${this._activeCount})`:""}</summary>
        <div class="selects">
          <label class="field">${e("search.kind")}
            <select .value=${i.kinds?.[0]??""} @change=${l=>this._set({kinds:l.target.value?[l.target.value]:void 0})}>
              <option value="">${e("search.any")}</option>
              ${s.map(l=>a`<option value=${l.id} ?selected=${i.kinds?.[0]===l.id}>${l.name}</option>`)}
            </select></label>
          <label class="field">${e("search.owner")}
            <select .value=${i.owner??""} @change=${l=>this._set({owner:l.target.value||void 0})}>
              <option value="">${e("search.any")}</option>
              ${n.map(l=>a`<option value=${l.id} ?selected=${i.owner===l.id}>${l.name}</option>`)}
            </select></label>
          <label class="field">${e("search.condition")}
            <select .value=${i.condition??""} @change=${l=>this._set({condition:l.target.value||void 0})}>
              <option value="">${e("search.any")}</option>
              ${["missing","defective","to_sell","to_give_away","disposed"].map(l=>a`<option value=${l} ?selected=${i.condition===l}>${e(`condition.${l}`)}</option>`)}
            </select></label>
          <label class="field">${e("search.tag")}
            <input .value=${i.tag??""} @change=${l=>this._set({tag:l.target.value.trim()||void 0})} /></label>
        </div>
        <div class="filters">
          ${Lt.map(l=>a`<button class="chip" aria-pressed=${i[l]?"true":"false"} @click=${()=>this._set({[l]:i[l]?void 0:!0})}>${e(Dt[l])}</button>`)}
          ${i.within?a`<button class="chip" aria-pressed="true" @click=${()=>this._set({within:void 0})}>${e("search.within")} ✕</button>`:c}
          ${this._activeCount?a`<button class="btn text" @click=${()=>this.ctx.go({page:"search",query:this.query,filters:{}},{replace:!0})}>${e("search.reset")}</button>`:c}
        </div>
      </details>
      ${d?a`<button class="btn primary jump" @click=${()=>this.ctx.go({page:"node",id:d.id})}><ha-icon icon="mdi:arrow-right-bold"></ha-icon>${e("search.jump",{name:d.name})}</button>`:c}
      ${this._error?a`<div class="error-text" role="alert">${this._error}</div>`:c}
      <div class="small muted" style="margin:0 4px 8px" aria-live="polite">
        ${this._hits===null?e("common.loading"):this._total===0?"":e(this._total>o.length?"search.countMore":"search.count",{n:this._total,shown:o.length})}
      </div>
      ${o.length?a`<ot-node-list .rows=${o} .showCounts=${!1} .label=${e("search.results")} @open-node=${l=>this.ctx.go({page:"node",id:l.detail})}></ot-node-list>`:this._hits!==null&&!this._loading?a`<div class="empty"><ha-icon icon="mdi:magnify-close"></ha-icon><p>${e("search.none")}</p></div>`:c}
    `}};customElements.define("ot-search-page",Ce);var Te=class extends u{constructor(){super();this._latest=new _;this._revision=-1;this._entries=null,this._error=""}static{this.properties={ctx:{attribute:!1},_entries:{state:!0},_error:{state:!0}}}static{this.styles=[v,g`
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
    `]}willUpdate(){let e=this.ctx?.revision??0;e!==this._revision&&(this._revision=e,this._load())}async _load(){try{let e=await this._latest.run(()=>this.ctx.api.trash());e&&(this._entries=e)}catch(e){this._error=h(e)}}async _restore(e){try{let s=(await this.ctx.api.restore(e.id)).parent==="unsortiert";this.ctx.toast(this.ctx.t(s?"trash.restoredUnsorted":"trash.restored",{name:e.name}))}catch(i){this.ctx.toast(h(i),"error")}}async _purge(e){let i=this.ctx.t;if(await this.ctx.confirm({title:i("trash.purgeTitle",{name:e.name}),message:i("trash.purgeMessage",{n:e.descendants}),confirmLabel:i("trash.purge"),danger:!0}))try{await this.ctx.api.purge(e.id)}catch(n){this.ctx.toast(h(n),"error")}}async _empty(){let e=this.ctx.t;if(await this.ctx.confirm({title:e("trash.emptyTitle"),message:e("trash.emptyMessage"),confirmLabel:e("trash.empty"),danger:!0}))try{let s=await this.ctx.api.emptyTrash();this.ctx.toast(e("trash.emptied",{n:s.removed}))}catch(s){this.ctx.toast(h(s),"error")}}render(){let e=this.ctx.t,i=this.ctx.catalog?.settings.trash_days??30;return a`
      <div class="row" style="margin:4px 0 8px">
        <h1 class="grow" style="font-size:1.5rem;font-weight:500">${e("nav.trash")}</h1>
        <button class="btn danger" ?disabled=${!this._entries?.length} @click=${this._empty}><ha-icon icon="mdi:delete-forever-outline"></ha-icon>${e("trash.empty")}</button>
      </div>
      <p class="muted small" style="margin:0 4px 12px">${e("trash.info",{days:i})}</p>
      ${this._error?a`<div class="error-text" role="alert">${this._error}</div>`:""}
      ${this._entries===null?a`<div class="empty muted">${e("common.loading")}</div>`:this._entries.length===0?a`<div class="empty"><ha-icon icon="mdi:delete-empty-outline"></ha-icon><p>${e("trash.none")}</p></div>`:a`<div class="list">
              ${this._entries.map(s=>a`<div class="entry">
                  <ha-icon class="icon muted" icon=${b(s)}></ha-icon>
                  <span class="grow">
                    <button class="btn text" style="padding:0;min-height:0;font-size:1rem;display:block" @click=${()=>this.ctx.go({page:"node",id:s.id})}>${s.number!==null?`${s.number} \xB7 `:""}${s.name}</button>
                    <span class="small muted">${s.kind_name}${s.descendants?` \xB7 ${e("trash.withContent",{n:s.descendants})}`:""}${s.trashed?` \xB7 ${e("trash.deletedOn",{date:E(s.trashed.at.slice(0,10),this.ctx.lang)})}`:""}</span>
                  </span>
                  <button class="icon-btn" aria-label=${e("trash.restore")} title=${e("trash.restore")} @click=${()=>this._restore(s)}><ha-icon icon="mdi:restore"></ha-icon></button>
                  <button class="icon-btn" aria-label=${e("trash.purge")} title=${e("trash.purge")} @click=${()=>this._purge(s)}><ha-icon icon="mdi:delete-forever-outline"></ha-icon></button>
                </div>`)}
            </div>`}
    `}};customElements.define("ot-trash-page",Te);var ot=["expiring","checkout_overdue","below_min","maintenance_due","missing"],Pe=class extends u{constructor(){super();this._latest=new _;this._revision=-1;this._data=null,this._error=""}static{this.properties={ctx:{attribute:!1},_data:{state:!0},_error:{state:!0}}}static{this.styles=[v,g`.sub { display: block; }`]}willUpdate(){let e=this.ctx?.revision??0;e!==this._revision&&(this._revision=e,this._load())}async _load(){try{let e=await this._latest.run(()=>this.ctx.api.due());e&&(this._data=e.categories)}catch(e){this._error=h(e)}}render(){let e=this.ctx.t;if(this._error)return a`<div class="error-text" role="alert">${this._error}</div>`;if(!this._data)return a`<div class="empty muted">${e("common.loading")}</div>`;let i=this._data,s=ot.reduce((n,o)=>n+(i[o]?.length??0),0);return a`
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0 12px">${e("due.title")}</h1>
      ${s===0?a`<div class="empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon><p>${e("due.none")}</p></div>`:""}
      ${ot.map(n=>{let o=i[n]??[];return o.length?a`
          <div class="section-title">${e(`due.${n}`)} (${o.length})</div>
          <div class="list">
            ${o.map(d=>a`<button class="item" @click=${()=>this.ctx.go({page:"node",id:d.node_id})}>
                <span class="grow">
                  <span class="title">${d.name}</span>
                  <span class="small muted sub">${[d.detail,d.due?E(d.due,this.ctx.lang):"",d.path].filter(Boolean).join(" \xB7 ")}</span>
                </span>
                ${d.overdue?a`<span class="chip error">${e("due.overdue")}</span>`:""}
              </button>`)}
          </div>
        `:""})}
    `}};customElements.define("ot-due-page",Pe);var M=class extends Error{constructor(e,i){super(i);this.code=e;this.name="ApiError"}},lt="ordnungstracker/",I=class{constructor(t){this.hass=t;this.status=()=>this.call("status");this.overview=()=>this.call("overview");this.catalog=()=>this.call("catalog");this.user=()=>this.call("user");this.due=()=>this.call("due");this.trash=()=>this.call("trash");this.byNumber=t=>this.call("by_number",{number:t});this.suggest=t=>this.call("suggest",t?{parent:t}:{});this.create=t=>this.call("create",t);this.update=(t,e)=>this.call("update",{node_id:t,changes:e});this.move=(t,e)=>this.call("move",{ids:t,parent:e});this.remove=(t,e)=>this.call("delete",{node_id:t,mode:e});this.restore=t=>this.call("restore",{node_id:t});this.purge=t=>this.call("purge",{node_id:t});this.emptyTrash=()=>this.call("trash_empty");this.favorite=(t,e)=>this.call("favorite",{node_id:t,value:e});this.addTarget=t=>this.call("target_add",{node_id:t});this.quickPreview=(t,e)=>this.call("quickadd_preview",{text:t,split_commas:e});this.quickApply=(t,e,i)=>this.call("quickadd_apply",{parent:t,text:e,split_commas:i});this.kindAdd=t=>this.call("kind_add",t);this.kindUpdate=(t,e)=>this.call("kind_update",{kind_id:t,changes:e});this.kindDelete=(t,e)=>this.call("kind_delete",e?{kind_id:t,replacement:e}:{kind_id:t});this.personAdd=(t,e)=>this.call("person_add",e?{name:t,ha_person:e}:{name:t});this.personUpdate=(t,e)=>this.call("person_update",{person_id:t,changes:e});this.personDelete=t=>this.call("person_delete",{person_id:t});this.exportData=(t,e)=>this.call("export",e?{format:t,node_id:e}:{format:t});this.importText=t=>this.call("import",{text:t});this.sampleLoad=()=>this.call("sample_load");this.sampleRemove=()=>this.call("sample_remove")}setHass(t){this.hass=t}async call(t,e={}){try{return await this.hass.callWS({type:lt+t,...e})}catch(i){let s=i;throw new M(s?.code??"unknown",s?.message??String(i))}}node(t,e={}){return this.call("node",{node_id:t,track:e.track??!1,include_archived:e.archived??!1})}search(t,e={},i=100){return this.call("search",{query:t,filters:e,limit:i})}subscribe(t){return this.hass.connection.subscribeMessage(t,{type:lt+"subscribe"})}};var Mt=["place","furniture","container","group","item"],ct=["kinds","persons","data"],Re=class extends u{static{this.properties={ctx:{attribute:!1},section:{type:String},_kind:{state:!0},_person:{state:!0},_error:{state:!0},_busy:{state:!0},_importText:{state:!0}}}constructor(){super(),this.section="kinds",this._kind=null,this._person=null,this._error="",this._busy=!1,this._importText=null}static{this.styles=[v,g`
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
    `]}get _section(){return ct.includes(this.section)?this.section:"kinds"}_editKind(t){this._error="",this._kind=t?{id:t.id,name:t.name,class:t.class,icon:t.icon,numbered:t.numbered,replacement:"",needsReplacement:!1}:{id:null,name:"",class:"container",icon:"",numbered:!1,replacement:"",needsReplacement:!1}}async _saveKind(){let t=this._kind;if(t){if(!t.name.trim()){this._error=this.ctx.t("form.nameRequired");return}this._busy=!0;try{t.id?await this.ctx.api.kindUpdate(t.id,{name:t.name,class:t.class,icon:t.icon,numbered:t.numbered}):await this.ctx.api.kindAdd({name:t.name,class:t.class,icon:t.icon,numbered:t.numbered}),this._kind=null,await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("form.saved"))}catch(e){this._error=h(e)}finally{this._busy=!1}}}async _deleteKind(){let t=this._kind;if(t?.id){this._busy=!0;try{await this.ctx.api.kindDelete(t.id,t.needsReplacement?t.replacement:void 0),this._kind=null,await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("settings.kindDeleted"))}catch(e){if(e instanceof M&&e.code==="in_use"&&!t.needsReplacement){let i=this.ctx.catalog?.kinds.find(s=>s.id!==t.id);this._kind={...t,needsReplacement:!0,replacement:i?.id??""},this._error=e.message}else this._error=h(e)}finally{this._busy=!1}}}_kindDialog(){let t=this.ctx.t,e=this._kind;if(!e)return c;let i=s=>this._kind={...e,...s};return a`
      <ot-dialog .heading=${e.id?t("settings.kindEdit"):t("settings.kindNew")} .closeLabel=${t("common.close")} @close=${()=>this._kind=null}>
        <div class="block">
          <label class="field">${t("form.name")} *<input .value=${e.name} @input=${s=>i({name:s.target.value})} /></label>
          <label class="field">${t("settings.class")}
            <select .value=${e.class} @change=${s=>i({class:s.target.value})}>
              ${Mt.map(s=>a`<option value=${s} ?selected=${e.class===s}>${t(`class.${s}`)} – ${t(`classHelp.${s}`)}</option>`)}
            </select></label>
          <label class="field">${t("settings.icon")}<input .value=${e.icon} placeholder="mdi:package-variant" @input=${s=>i({icon:s.target.value})} /></label>
          <label class="check"><input type="checkbox" .checked=${e.numbered} @change=${s=>i({numbered:s.target.checked})} />${t("settings.numbered")}</label>
          ${e.needsReplacement?a`<label class="field">${t("settings.replacement")}
                <select .value=${e.replacement} @change=${s=>i({replacement:s.target.value})}>
                  ${(this.ctx.catalog?.kinds??[]).filter(s=>s.id!==e.id).map(s=>a`<option value=${s.id} ?selected=${s.id===e.replacement}>${s.name}</option>`)}
                </select></label>`:c}
          ${this._error?a`<div class="error-text" role="alert">${this._error}</div>`:c}
        </div>
        ${e.id?a`<button slot="footer" class="btn danger" ?disabled=${this._busy} @click=${this._deleteKind}>${e.needsReplacement?t("settings.replaceDelete"):t("common.delete")}</button>`:c}
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._saveKind}>${t("common.save")}</button>
      </ot-dialog>
    `}_editPerson(t){this._error="",this._person={id:t?.id??null,name:t?.name??"",ha:t?.ha_person??""}}async _savePerson(){let t=this._person;if(t){if(!t.name.trim()){this._error=this.ctx.t("form.nameRequired");return}this._busy=!0;try{t.id?await this.ctx.api.personUpdate(t.id,{name:t.name,ha_person:t.ha||null}):await this.ctx.api.personAdd(t.name,t.ha||null),this._person=null,await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("form.saved"))}catch(e){this._error=h(e)}finally{this._busy=!1}}}async _deletePerson(){let t=this._person;if(!t?.id)return;let e=this.ctx.t;if(await this.ctx.confirm({title:e("settings.personDeleteTitle",{name:t.name}),message:e("settings.personDeleteMessage"),confirmLabel:e("common.delete"),danger:!0}))try{let s=await this.ctx.api.personDelete(t.id);this._person=null,await this.ctx.reloadCatalog(),this.ctx.toast(e("settings.personDeleted",{n:s.cleared}))}catch(s){this._error=h(s)}}_personDialog(){let t=this.ctx.t,e=this._person;if(!e)return c;let i=n=>this._person={...e,...n},s=Object.keys(this.ctx.hass.states).filter(n=>n.startsWith("person."));return a`
      <ot-dialog .heading=${e.id?t("settings.personEdit"):t("settings.personNew")} .closeLabel=${t("common.close")} @close=${()=>this._person=null}>
        <div class="block">
          <label class="field">${t("form.name")} *<input .value=${e.name} @input=${n=>i({name:n.target.value})} /></label>
          <label class="field">${t("settings.haPerson")}
            <select .value=${e.ha} @change=${n=>i({ha:n.target.value})}>
              <option value="" ?selected=${e.ha===""}>${t("settings.noHaPerson")}</option>
              ${s.map(n=>a`<option value=${n} ?selected=${n===e.ha}>${this.ctx.hass.states[n].attributes.friendly_name??n}</option>`)}
            </select></label>
          ${this._error?a`<div class="error-text" role="alert">${this._error}</div>`:c}
        </div>
        ${e.id?a`<button slot="footer" class="btn danger" @click=${this._deletePerson}>${t("common.delete")}</button>`:c}
        <button slot="footer" class="btn primary" ?disabled=${this._busy} @click=${this._savePerson}>${t("common.save")}</button>
      </ot-dialog>
    `}async _export(t){try{let e=await this.ctx.api.exportData(t);st(e.filename,e.text,t==="json"?"application/json":"text/markdown"),this.ctx.toast(this.ctx.t("data.exported",{name:e.filename}))}catch(e){this.ctx.toast(h(e),"error")}}async _copy(){try{let t=await this.ctx.api.exportData("json");await navigator.clipboard.writeText(t.text),this.ctx.toast(this.ctx.t("data.copied"))}catch(t){this.ctx.toast(h(t),"error")}}async _pickFile(t){let e=t.target,i=e.files?.[0];e.value="",i&&(this._importText=await i.text(),this._error="")}async _import(){if(this._importText===null)return;let t=this.ctx.t;if(await this.ctx.confirm({title:t("data.importTitle"),message:t("data.importMessage"),confirmLabel:t("data.import"),danger:!0})){this._busy=!0;try{let i=await this.ctx.api.importText(this._importText);this._importText=null,await this.ctx.reloadCatalog(),this.ctx.toast(t("data.imported",{n:i.nodes}))}catch(i){this._error=h(i)}finally{this._busy=!1}}}_data(){let t=this.ctx.t,e=this.ctx.status;return a`
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
          ${this._importText!==null?a`<div class="row wrap"><span class="grow small">${t("data.ready",{kb:Math.max(1,Math.round(this._importText.length/1024))})}</span>
                <button class="btn danger" ?disabled=${this._busy} @click=${this._import}>${t("data.import")}</button></div>`:c}
          ${this._error&&!this._kind&&!this._person?a`<div class="error-text" role="alert">${this._error}</div>`:c}
        </div>
        <div class="card block">
          <h2>${t("sample.title")}</h2>
          ${this.ctx.catalog?.sample_loaded?a`<p class="muted small" style="margin:0">${t("sample.active")}</p><div><button class="btn danger" @click=${this._removeSample}>${t("sample.remove")}</button></div>`:a`<p class="muted small" style="margin:0">${e?.inventory_empty?t("sample.help"):t("sample.onlyEmpty")}</p>
                <div><button class="btn" ?disabled=${!e?.inventory_empty} @click=${this._loadSample}>${t("sample.load")}</button></div>`}
        </div>
        <div class="muted small" style="margin:8px 4px">${t("settings.about",{version:"0.4.0",nodes:e?.nodes??0})}</div>
      </div>
    `}async _loadSample(){try{await this.ctx.api.sampleLoad(),await this.ctx.reloadCatalog(),this.ctx.toast(this.ctx.t("sample.loaded"))}catch(t){this.ctx.toast(h(t),"error")}}async _removeSample(){let t=this.ctx.t;if(await this.ctx.confirm({title:t("sample.removeTitle"),message:t("sample.removeMessage"),confirmLabel:t("sample.remove"),danger:!0}))try{await this.ctx.api.sampleRemove(),await this.ctx.reloadCatalog(),this.ctx.toast(t("sample.removed"))}catch(i){this.ctx.toast(h(i),"error")}}render(){let t=this.ctx.t,e=this._section,i=this.ctx.catalog;return a`
      <h1 style="font-size:1.5rem;font-weight:500;margin:4px 0">${t("nav.settings")}</h1>
      <div class="tabs" role="tablist">
        ${ct.map(s=>a`<button class="chip" role="tab" aria-selected=${e===s?"true":"false"} aria-pressed=${e===s?"true":"false"} @click=${()=>this.ctx.go({page:"settings",section:s},{replace:!0})}>${t(`settings.tab.${s}`)}</button>`)}
      </div>
      ${e==="kinds"?a`<p class="muted small" style="margin:0 4px 10px">${t("settings.kindsHelp")}</p>
            <div class="list">
              ${(i?.kinds??[]).map(s=>a`<button class="entry" @click=${()=>this._editKind(s)}>
                <ha-icon class="muted" icon=${b(s)}></ha-icon>
                <span class="grow"><span>${s.name}</span><span class="small muted" style="display:block">${t(`class.${s.class}`)}${s.numbered?` \xB7 ${t("settings.numberedShort")}`:""}</span></span>
                <ha-icon class="muted" icon="mdi:pencil"></ha-icon></button>`)}
            </div>
            <div style="margin-top:12px"><button class="btn primary" @click=${()=>this._editKind(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("settings.kindNew")}</button></div>`:c}
      ${e==="persons"?a`<p class="muted small" style="margin:0 4px 10px">${t("settings.personsHelp")}</p>
            ${(i?.persons??[]).length?a`<div class="list">${i.persons.map(s=>a`<button class="entry" @click=${()=>this._editPerson(s)}>
                  <ha-icon class="muted" icon="mdi:account"></ha-icon>
                  <span class="grow"><span>${s.name}</span>${s.ha_person?a`<span class="small muted" style="display:block">${this.ctx.hass.states[s.ha_person]?.attributes.friendly_name??s.ha_person}</span>`:c}</span>
                  <ha-icon class="muted" icon="mdi:pencil"></ha-icon></button>`)}</div>`:a`<div class="empty small">${t("settings.noPersons")}</div>`}
            <div style="margin-top:12px"><button class="btn primary" @click=${()=>this._editPerson(null)}><ha-icon icon="mdi:plus"></ha-icon>${t("settings.personNew")}</button></div>`:c}
      ${e==="data"?this._data():c}
      ${this._kindDialog()} ${this._personDialog()}
    `}};customElements.define("ot-settings-page",Re);var Le=class extends u{constructor(){super();this._revision=-1;this.currentId="",this._children={},this._open=new Set(["_root"])}static{this.properties={ctx:{attribute:!1},currentId:{type:String},_children:{state:!0},_open:{state:!0}}}static{this.styles=[v,g`
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
    `]}willUpdate(){let e=this.ctx?.revision??0;e!==this._revision&&(this._revision=e,this._reloadOpen())}async _reloadOpen(){for(let e of this._open)await this._load(e)}async _load(e){try{let s=(await this.ctx.api.node(e==="_root"?null:e)).contents.filter(n=>n.class!=="item"&&n.id!=="papierkorb");this._children={...this._children,[e]:s}}catch{}}async _toggle(e){let i=new Set(this._open);i.has(e)?i.delete(e):(i.add(e),this._children[e]||await this._load(e)),this._open=i}_branch(e,i=!1){let s=this._children[e];return s?a`<ul class=${i?"root":""} role=${i?"tree":"group"}>
      ${s.map(n=>{let o=this._open.has(n.id),d=n.children>0;return a`<li role="treeitem" aria-expanded=${d?String(o):c}>
          <div class="node">
            ${d?a`<button class="toggle" aria-label=${o?this.ctx.t("tree.collapse",{name:n.name}):this.ctx.t("tree.expand",{name:n.name})} @click=${()=>this._toggle(n.id)}><ha-icon icon=${o?"mdi:chevron-down":"mdi:chevron-right"}></ha-icon></button>`:a`<span class="spacer"></span>`}
            <button class="name ${n.id===this.currentId?"current":""}" aria-current=${n.id===this.currentId?"page":c} @click=${()=>this.ctx.go({page:"node",id:n.id})}>
              <ha-icon icon=${b(n)}></ha-icon>
              ${n.number!==null?a`<span class="badge">${n.number}</span>`:c}
              <span class="ellipsis">${n.name}</span>
            </button>
          </div>
          ${o?this._branch(n.id):c}
        </li>`})}
    </ul>`:c}render(){return this._children._root||this._load("_root"),a`<nav aria-label=${this.ctx.t("tree.label")}>${this._branch("_root",!0)}</nav>`}};customElements.define("ot-tree",Le);var De={"app.title":"Ordnung","common.cancel":"Abbrechen","common.close":"Schlie\xDFen","common.delete":"L\xF6schen","common.edit":"Bearbeiten","common.loading":"Lade \u2026","common.move":"Verschieben","common.no":"Nein","common.save":"Speichern","common.start":"Start","common.yes":"Ja","nav.back":"Zur\xFCck","nav.browse":"St\xF6bern","nav.due":"F\xE4llig","nav.main":"Hauptnavigation","nav.menu":"Seitenleiste \xF6ffnen","nav.overview":"\xDCbersicht","nav.settings":"Einstellungen","nav.trash":"Papierkorb","class.place":"R\xE4ume","class.furniture":"M\xF6bel","class.container":"Beh\xE4lter","class.group":"Gruppen","class.item":"Dinge","classHelp.place":"Ort, an dem etwas steht","classHelp.furniture":"M\xF6bel oder Ablage","classHelp.container":"beweglicher Beh\xE4lter","classHelp.group":"Sammelbezeichnung f\xFCr Inhalt","classHelp.item":"einzelnes Ding","condition.ok":"in Ordnung","condition.missing":"vermisst","condition.defective":"defekt","condition.to_sell":"zu verkaufen","condition.to_give_away":"zu verschenken","condition.disposed":"entsorgt / weggegeben","overview.welcome":"Willkommen im Ordnungs-Tracker","overview.welcomeText":"Lege zuerst einen Raum an (z. B. \u201EKeller\u201C), darin ein Regal und Kisten mit Nummern \u2013 und schreibe hinein, was darin liegt. Grob anfangen reicht: Verfeinern kannst du sp\xE4ter.","overview.start":"Loslegen","overview.containers":"Beh\xE4lter","overview.items":"Dinge","overview.unsorted":"Unsortiert","overview.checkedOut":"Entnommen","overview.due":"F\xE4llig","overview.restock":"Nachkaufen","overview.nextNumber":"N\xE4chste freie Nummer: {n}","overview.value":"Gesamtwert: {value}","overview.favorites":"Favoriten","overview.favoritesEmpty":"Tippe bei einem Eintrag auf den Stern, dann erscheint er hier.","overview.recent":"Zuletzt angesehen","overview.recentEmpty":"Hier stehen die Eintr\xE4ge, die du zuletzt ge\xF6ffnet hast.","overview.emptyContainers":"Leere Beh\xE4lter","node.rootTitle":"Alle Orte","node.new":"Neu","node.quick":"Schnellerfassung","node.selectAll":"Alle ausw\xE4hlen","node.contents":"Inhalt","node.selected":"{n} ausgew\xE4hlt","node.selection":"Auswahl","node.favorite":"Zu Favoriten hinzuf\xFCgen","node.unfavorite":"Aus Favoriten entfernen","node.more":"Weitere Aktionen","node.kind":"Art","node.owner":"Besitzer","node.inherited":"geerbt","node.quantity":"Menge","node.minimum":"Mindestbestand","node.aliases":"Auch bekannt als","node.tags":"Schlagw\xF6rter","node.note":"Notiz","node.condition":"Zustand","node.lentTo":"Ausgeliehen an","node.outAt":"Entnommen, jetzt","node.since":"seit","node.until":"bis","node.viaContainer":"\xFCber den Beh\xE4lter","node.unassigned":"nicht mehr zugeordnet","node.emptyRoot":"Noch nichts da. Tippe auf \u201ENeu\u201C und lege einen Raum an, zum Beispiel \u201EKeller\u201C.","node.emptyPlace":"In diesem Raum liegt noch nichts. Lege ein Regal oder eine Kiste an \u2013 oder nutze die Schnellerfassung.","node.emptyContainer":"Diese Kiste ist leer. Tippe auf \u201ESchnellerfassung\u201C und schreibe auf, was hineinkommt \u2013 eine Zeile pro Ding.","node.emptyItem":"Hier ist nichts abgelegt. Wenn du etwas hineinlegst, wird aus dem Ding automatisch eine Gruppe.","node.emptyGeneric":"Hier ist noch nichts. Tippe auf \u201ENeu\u201C oder nutze die Schnellerfassung.","node.emptyTrashed":"Dieser Eintrag liegt im Papierkorb.","form.createTitle":"Neuer Eintrag","form.editTitle":"Eintrag bearbeiten","form.name":"Name","form.nameRequired":"Bitte gib einen Namen an.","form.kind":"Art","form.number":"Nummer","form.numberNone":"keine","form.numberInvalid":"Nummer, Menge und Mindestbestand m\xFCssen Zahlen sein (Nummer: ganze Zahl ab 1).","form.more":"Weitere Angaben","form.aliases":"Auch bekannt als (mit Komma trennen)","form.tags":"Schlagw\xF6rter (mit Komma trennen)","form.owner":"Besitzer","form.ownerNone":"\u2013 keiner \u2013","form.ownerInherited":"\u2013 geerbt von {name} \u2013","form.quantity":"Menge","form.unit":"Einheit","form.minQuantity":"Mindestbestand","form.note":"Notiz","form.created":"\u201E{name}\u201C angelegt","form.saved":"Gespeichert","quick.title":"Schnellerfassung in \u201E{name}\u201C","quick.placeholder":`Schere
3x Batterien AA
2 Rollen Klebeband
Bastelsachen
  Buntpapier
  Kleber`,"quick.commas":"Kommas trennen Eintr\xE4ge (praktisch beim Diktieren)","quick.help":"Eine Zeile pro Ding. Eine Menge davor wird erkannt (3x \u2026, 2 Rollen \u2026). Einger\xFCckte Zeilen geh\xF6ren zur Zeile dar\xFCber.","quick.preview":"Das wird angelegt ({n})","quick.apply":"{n} anlegen","quick.done":"{n} Eintr\xE4ge angelegt","move.titleOne":"Eintrag verschieben","move.titleMany":"{n} Eintr\xE4ge verschieben","move.search":"Ziel suchen oder Kistennummer eingeben","move.searchPlaceholder":"z. B. Regal oder 14","move.recent":"Zuletzt verwendet","move.browse":"St\xF6bern","move.chooseHere":"\u201E{name}\u201C w\xE4hlen","move.topLevel":"Oberste Ebene","move.nothingBelow":"Hier gibt es nichts, wohin man etwas legen k\xF6nnte.","move.open":"\u201E{name}\u201C \xF6ffnen","move.target":"Ziel: {name}","move.noTarget":"W\xE4hle ein Ziel.","move.do":"Hierher verschieben","move.done":"{n} nach \u201E{name}\u201C verschoben","delete.title":"\u201E{name}\u201C l\xF6schen?","delete.withContent":"Darin liegen {n} Unterpunkte. Was soll damit geschehen?","delete.empty":"Der Eintrag wird in den Papierkorb gelegt.","delete.modeTrash":"Samt Inhalt in den Papierkorb ({n} Unterpunkte)","delete.modeLift":"Nur diesen Eintrag entfernen, der Inhalt r\xFCckt eine Ebene nach oben","delete.trashInfo":"Im Papierkorb bleibt alles {days} Tage lang wiederherstellbar.","delete.doneOne":"\u201E{name}\u201C in den Papierkorb gelegt","delete.done":"{n} Eintr\xE4ge in den Papierkorb gelegt","delete.manyTitle":"{n} Eintr\xE4ge l\xF6schen?","delete.manyMessage":"Die {n} ausgew\xE4hlten Eintr\xE4ge werden samt Inhalt in den Papierkorb gelegt und k\xF6nnen dort wiederhergestellt werden.","trash.info":"Gel\xF6schtes bleibt {days} Tage im Papierkorb und wird danach endg\xFCltig entfernt.","trash.none":"Der Papierkorb ist leer.","trash.restore":"Wiederherstellen","trash.restored":"\u201E{name}\u201C wiederhergestellt","trash.restoredUnsorted":"\u201E{name}\u201C wiederhergestellt \u2013 der alte Platz existiert nicht mehr, deshalb liegt es jetzt in \u201EUnsortiert\u201C","trash.purge":"Endg\xFCltig l\xF6schen","trash.purgeTitle":"\u201E{name}\u201C endg\xFCltig l\xF6schen?","trash.purgeMessage":"Der Eintrag und {n} Unterpunkte werden unwiderruflich entfernt. Verweise darauf aus Listen verschwinden.","trash.empty":"Papierkorb leeren","trash.emptyTitle":"Papierkorb leeren?","trash.emptyMessage":"Alles im Papierkorb wird unwiderruflich entfernt.","trash.emptied":"{n} Eintr\xE4ge endg\xFCltig entfernt","trash.withContent":"mit {n} Unterpunkten","trash.deletedOn":"gel\xF6scht am {date}","trash.bannerTop":"Dieser Eintrag liegt im Papierkorb (gel\xF6scht am {date}).","trash.bannerInside":"Dieser Eintrag geh\xF6rt zu einem gel\xF6schten Eintrag. Stelle den obersten Eintrag wieder her.","search.placeholder":"Suchen oder Nummer eingeben \u2026","search.filter":"Filter","search.moreFilters":"Weitere Filter","search.kind":"Art","search.owner":"Besitzer","search.condition":"Zustand","search.tag":"Schlagwort","search.any":"egal","search.fOut":"entnommen","search.fNumber":"mit Nummer","search.fEmpty":"ohne Inhalt","search.fStale":"lange nicht best\xE4tigt","search.fArchived":"mit Archivierten","search.within":"innerhalb eines Ortes","search.reset":"Filter zur\xFCcksetzen","search.jump":"Zu \u201E{name}\u201C springen","search.count":"{n} Treffer","search.countMore":"{n} Treffer, die ersten {shown} werden gezeigt","search.none":"Nichts gefunden. Pr\xFCfe die Schreibweise oder lockere die Filter.","search.results":"Suchergebnisse","due.title":"F\xE4llig","due.none":"Nichts f\xE4llig. Alles in Ordnung.","due.overdue":"\xFCberf\xE4llig","due.expiring":"L\xE4uft bald ab oder ist abgelaufen","due.checkout_overdue":"R\xFCckgabe \xFCberf\xE4llig","due.below_min":"Unter Mindestbestand","due.maintenance_due":"Wartung f\xE4llig","due.missing":"Vermisst","sample.title":"Beispieldaten","sample.load":"Beispieldaten laden","sample.help":"L\xE4dt einen kleinen Beispielhaushalt (etwa 60 Eintr\xE4ge) zum Ausprobieren. Du kannst ihn jederzeit wieder entfernen.","sample.onlyEmpty":"Beispieldaten lassen sich nur in ein leeres Inventar laden.","sample.active":"Die Beispieldaten sind geladen.","sample.loaded":"Beispieldaten geladen","sample.remove":"Beispieldaten entfernen","sample.removeTitle":"Beispieldaten entfernen?","sample.removeMessage":"Alle Beispieleintr\xE4ge werden gel\xF6scht. Eigene Eintr\xE4ge, die du in Beispiel-Kisten gelegt hast, wandern nach \u201EUnsortiert\u201C.","sample.removed":"Beispieldaten entfernt","settings.tab.kinds":"Arten","settings.tab.persons":"Personen","settings.tab.data":"Daten","settings.kindsHelp":"Eine Art legt fest, was ein Eintrag ist (Raum, Regal, Kiste \u2026). Eigene Arten \u2013 etwa \u201ESchublade\u201C oder \u201EKoffer\u201C \u2013 geh\xF6ren immer zu einer von f\xFCnf Klassen.","settings.kindNew":"Neue Art","settings.kindEdit":"Art bearbeiten","settings.kindDeleted":"Art gel\xF6scht","settings.class":"Klasse","settings.icon":"Symbol (z. B. mdi:package-variant)","settings.numbered":"Eintr\xE4ge dieser Art bekommen \xFCblicherweise eine Nummer","settings.numberedShort":"nummeriert","settings.replacement":"Diese Art wird noch verwendet. Auf welche Art sollen die Eintr\xE4ge umgestellt werden?","settings.replaceDelete":"Umstellen und l\xF6schen","settings.personsHelp":"Personen k\xF6nnen Besitzer von Eintr\xE4gen sein. Der Besitz vererbt sich nach unten: Geh\xF6rt die Werkstatt Papa, geh\xF6rt alles darin Papa \u2013 au\xDFer, weiter unten steht etwas anderes.","settings.noPersons":"Noch keine Personen angelegt.","settings.personNew":"Neue Person","settings.personEdit":"Person bearbeiten","settings.personDeleteTitle":"\u201E{name}\u201C l\xF6schen?","settings.personDeleteMessage":"Die Zuordnung zu Eintr\xE4gen entf\xE4llt. Die Eintr\xE4ge selbst bleiben bestehen.","settings.personDeleted":"Person gel\xF6scht ({n} Zuordnungen entfernt)","settings.haPerson":"Mit Person aus Home Assistant verkn\xFCpfen","settings.noHaPerson":"\u2013 nicht verkn\xFCpft \u2013","settings.about":"Ordnungs-Tracker {version} \xB7 {nodes} Eintr\xE4ge","data.export":"Exportieren","data.exportHelp":"inventar.json enth\xE4lt alle deine Daten und l\xE4sst sich sichern oder in ein anderes System mitnehmen. Die Markdown-Liste ist zum Lesen und Ausdrucken.","data.markdown":"Lesbare Liste (Markdown)","data.copy":"In die Zwischenablage kopieren","data.copied":"inventar.json in die Zwischenablage kopiert","data.exported":"{name} gespeichert","data.import":"Importieren","data.importHelp":"Eine zuvor exportierte inventar.json ersetzt das gesamte Inventar \u2013 nach Pr\xFCfung und R\xFCckfrage. Vorher wird automatisch eine Sicherung angelegt.","data.ready":"Datei gelesen ({kb} KB)","data.importTitle":"Inventar ersetzen?","data.importMessage":"Das gesamte aktuelle Inventar wird durch die Datei ersetzt. Eine Sicherung des aktuellen Stands wird vorher angelegt.","data.imported":"Importiert ({n} Eintr\xE4ge)","card.title":"Titel (freiwillig)","card.mode":"Betriebsart","card.modeSearch":"Nur Suche","card.modeTiles":"Suche mit Kacheln","card.modeNode":"Inhalt eines Eintrags","card.node":"Eintrag (Kennung oder Nummer)","card.nodeHelp":"Z. B. die Nummer einer Kiste: 14.","tree.label":"Orte","tree.expand":"\u201E{name}\u201C aufklappen","tree.collapse":"\u201E{name}\u201C zuklappen"};var dt={"app.title":"Storage","common.cancel":"Cancel","common.close":"Close","common.delete":"Delete","common.edit":"Edit","common.loading":"Loading \u2026","common.move":"Move","common.no":"No","common.save":"Save","common.start":"Home","common.yes":"Yes","nav.back":"Back","nav.browse":"Browse","nav.due":"Due","nav.main":"Main navigation","nav.menu":"Open sidebar","nav.overview":"Overview","nav.settings":"Settings","nav.trash":"Trash","class.place":"Rooms","class.furniture":"Furniture","class.container":"Containers","class.group":"Groups","class.item":"Things","classHelp.place":"a place where things stand","classHelp.furniture":"furniture or shelf","classHelp.container":"movable container","classHelp.group":"collective name for contents","classHelp.item":"a single thing","condition.ok":"fine","condition.missing":"missing","condition.defective":"defective","condition.to_sell":"to sell","condition.to_give_away":"to give away","condition.disposed":"disposed / given away","overview.welcome":"Welcome to Ordnungs-Tracker","overview.welcomeText":'Start by adding a room (e.g. "Cellar"), then a shelf and numbered boxes inside \u2013 and write down what is in them. A rough start is fine: you can refine later.',"overview.start":"Get started","overview.containers":"Containers","overview.items":"Things","overview.unsorted":"Unsorted","overview.checkedOut":"Checked out","overview.due":"Due","overview.restock":"Restock","overview.nextNumber":"Next free number: {n}","overview.value":"Total value: {value}","overview.favorites":"Favorites","overview.favoritesEmpty":"Tap the star on an entry and it shows up here.","overview.recent":"Recently viewed","overview.recentEmpty":"The entries you opened last show up here.","overview.emptyContainers":"Empty containers","node.rootTitle":"All places","node.new":"New","node.quick":"Quick add","node.selectAll":"Select all","node.contents":"Contents","node.selected":"{n} selected","node.selection":"Selection","node.favorite":"Add to favorites","node.unfavorite":"Remove from favorites","node.more":"More actions","node.kind":"Kind","node.owner":"Owner","node.inherited":"inherited","node.quantity":"Quantity","node.minimum":"minimum","node.aliases":"Also known as","node.tags":"Tags","node.note":"Note","node.condition":"Condition","node.lentTo":"Lent to","node.outAt":"Taken out, now","node.since":"since","node.until":"until","node.viaContainer":"via the container","node.unassigned":"no longer assigned","node.emptyRoot":'Nothing here yet. Tap "New" and add a room, for example "Cellar".',"node.emptyPlace":"Nothing in this room yet. Add a shelf or a box \u2013 or use quick add.","node.emptyContainer":'This box is empty. Tap "Quick add" and write down what goes in \u2013 one line per thing.',"node.emptyItem":"Nothing is stored here. If you put something in, the thing automatically becomes a group.","node.emptyGeneric":'Nothing here yet. Tap "New" or use quick add.',"node.emptyTrashed":"This entry is in the trash.","form.createTitle":"New entry","form.editTitle":"Edit entry","form.name":"Name","form.nameRequired":"Please enter a name.","form.kind":"Kind","form.number":"Number","form.numberNone":"none","form.numberInvalid":"Number, quantity and minimum stock must be numbers (number: whole, from 1).","form.more":"More details","form.aliases":"Also known as (comma separated)","form.tags":"Tags (comma separated)","form.owner":"Owner","form.ownerNone":"\u2013 none \u2013","form.ownerInherited":"\u2013 inherited from {name} \u2013","form.quantity":"Quantity","form.unit":"Unit","form.minQuantity":"Minimum stock","form.note":"Note","form.created":'"{name}" created',"form.saved":"Saved","quick.title":'Quick add in "{name}"',"quick.placeholder":`Scissors
3x AA batteries
2 rolls of tape
Craft supplies
  Colored paper
  Glue`,"quick.commas":"Commas separate entries (handy when dictating)","quick.help":"One line per thing. A leading quantity is recognized (3x \u2026, 2 rolls \u2026). Indented lines belong to the line above.","quick.preview":"This will be created ({n})","quick.apply":"Create {n}","quick.done":"{n} entries created","move.titleOne":"Move entry","move.titleMany":"Move {n} entries","move.search":"Search a target or enter a box number","move.searchPlaceholder":"e.g. shelf or 14","move.recent":"Recently used","move.browse":"Browse","move.chooseHere":'Choose "{name}"',"move.topLevel":"Top level","move.nothingBelow":"Nothing in here that could hold something.","move.open":'Open "{name}"',"move.target":"Target: {name}","move.noTarget":"Choose a target.","move.do":"Move here","move.done":'Moved {n} to "{name}"',"delete.title":'Delete "{name}"?',"delete.withContent":"It contains {n} sub-entries. What should happen to them?","delete.empty":"The entry will be moved to the trash.","delete.modeTrash":"To the trash including contents ({n} sub-entries)","delete.modeLift":"Remove only this entry; its contents move up one level","delete.trashInfo":"Everything stays restorable in the trash for {days} days.","delete.doneOne":'"{name}" moved to the trash',"delete.done":"{n} entries moved to the trash","delete.manyTitle":"Delete {n} entries?","delete.manyMessage":"The {n} selected entries are moved to the trash including their contents and can be restored there.","trash.info":"Deleted entries stay in the trash for {days} days and are then removed for good.","trash.none":"The trash is empty.","trash.restore":"Restore","trash.restored":'"{name}" restored',"trash.restoredUnsorted":'"{name}" restored \u2013 its old place no longer exists, so it is now in "Unsorted"',"trash.purge":"Delete permanently","trash.purgeTitle":'Delete "{name}" permanently?',"trash.purgeMessage":"The entry and {n} sub-entries are removed irrevocably. References from lists disappear.","trash.empty":"Empty trash","trash.emptyTitle":"Empty the trash?","trash.emptyMessage":"Everything in the trash is removed irrevocably.","trash.emptied":"{n} entries removed permanently","trash.withContent":"with {n} sub-entries","trash.deletedOn":"deleted on {date}","trash.bannerTop":"This entry is in the trash (deleted on {date}).","trash.bannerInside":"This entry belongs to a deleted entry. Restore the topmost entry.","search.placeholder":"Search or enter a number \u2026","search.filter":"Filters","search.moreFilters":"More filters","search.kind":"Kind","search.owner":"Owner","search.condition":"Condition","search.tag":"Tag","search.any":"any","search.fOut":"checked out","search.fNumber":"with number","search.fEmpty":"empty","search.fStale":"not verified for long","search.fArchived":"incl. archived","search.within":"inside one place","search.reset":"Reset filters","search.jump":'Jump to "{name}"',"search.count":"{n} results","search.countMore":"{n} results, showing the first {shown}","search.none":"Nothing found. Check the spelling or loosen the filters.","search.results":"Search results","due.title":"Due","due.none":"Nothing due. All good.","due.overdue":"overdue","due.expiring":"Expiring soon or expired","due.checkout_overdue":"Return overdue","due.below_min":"Below minimum stock","due.maintenance_due":"Maintenance due","due.missing":"Missing","sample.title":"Sample data","sample.load":"Load sample data","sample.help":"Loads a small sample household (about 60 entries) to try things out. You can remove it at any time.","sample.onlyEmpty":"Sample data can only be loaded into an empty inventory.","sample.active":"The sample data is loaded.","sample.loaded":"Sample data loaded","sample.remove":"Remove sample data","sample.removeTitle":"Remove sample data?","sample.removeMessage":'All sample entries are deleted. Entries of your own that you put into sample boxes move to "Unsorted".',"sample.removed":"Sample data removed","settings.tab.kinds":"Kinds","settings.tab.persons":"People","settings.tab.data":"Data","settings.kindsHelp":'A kind says what an entry is (room, shelf, box \u2026). Your own kinds \u2013 e.g. "Drawer" or "Suitcase" \u2013 always belong to one of five classes.',"settings.kindNew":"New kind","settings.kindEdit":"Edit kind","settings.kindDeleted":"Kind deleted","settings.class":"Class","settings.icon":"Icon (e.g. mdi:package-variant)","settings.numbered":"Entries of this kind usually get a number","settings.numberedShort":"numbered","settings.replacement":"This kind is still in use. Which kind should the entries be switched to?","settings.replaceDelete":"Switch and delete","settings.personsHelp":"People can own entries. Ownership is inherited downwards: if the workshop belongs to Dad, everything in it does too \u2013 unless something further down says otherwise.","settings.noPersons":"No people yet.","settings.personNew":"New person","settings.personEdit":"Edit person","settings.personDeleteTitle":'Delete "{name}"?',"settings.personDeleteMessage":"The assignment to entries is removed. The entries themselves stay.","settings.personDeleted":"Person deleted ({n} assignments removed)","settings.haPerson":"Link to a Home Assistant person","settings.noHaPerson":"\u2013 not linked \u2013","settings.about":"Ordnungs-Tracker {version} \xB7 {nodes} entries","data.export":"Export","data.exportHelp":"inventar.json contains all your data and can be backed up or taken to another system. The Markdown list is for reading and printing.","data.markdown":"Readable list (Markdown)","data.copy":"Copy to clipboard","data.copied":"inventar.json copied to the clipboard","data.exported":"{name} saved","data.import":"Import","data.importHelp":"A previously exported inventar.json replaces the whole inventory \u2013 after validation and confirmation. A backup is created first.","data.ready":"File read ({kb} KB)","data.importTitle":"Replace the inventory?","data.importMessage":"The entire current inventory will be replaced by the file. A backup of the current state is created first.","data.imported":"Imported ({n} entries)","card.title":"Title (optional)","card.mode":"Mode","card.modeSearch":"Search only","card.modeTiles":"Search with tiles","card.modeNode":"Contents of an entry","card.node":"Entry (id or number)","card.nodeHelp":"E.g. a box number: 14.","tree.label":"Places","tree.expand":'Expand "{name}"',"tree.collapse":'Collapse "{name}"'};var Nt={de:De,en:dt};function Me(r){return(r??"de").toLowerCase().startsWith("de")?"de":"en"}function O(r){let t=Nt[Me(r)];return(e,i)=>{let s=t[e]??De[e]??e;if(i)for(let[n,o]of Object.entries(i))s=s.replaceAll(`{${n}}`,String(o));return s}}var y="/ordnungstracker",qt=["place","furniture","container","group","item"];function Ht(r,t){r.kinds?.length&&t.set("kind",r.kinds.join(",")),r.classes?.length&&t.set("class",r.classes.join(",")),r.within&&t.set("within",r.within),r.owner&&t.set("owner",r.owner),r.tag&&t.set("tag",r.tag),r.condition&&t.set("cond",r.condition),r.checked_out!==void 0&&t.set("out",r.checked_out?"1":"0"),r.has_number&&t.set("num","1"),r.empty&&t.set("empty","1"),r.stale&&t.set("stale","1"),r.include_archived&&t.set("arch","1")}function It(r){let t={},e=r.get("kind");e&&(t.kinds=e.split(",").filter(Boolean));let i=r.get("class");i&&(t.classes=i.split(",").filter(s=>qt.includes(s)));for(let[s,n]of[["within","within"],["owner","owner"],["tag","tag"],["cond","condition"]]){let o=r.get(s);o&&(t[n]=o)}return r.get("out")==="1"&&(t.checked_out=!0),r.get("out")==="0"&&(t.checked_out=!1),r.get("num")==="1"&&(t.has_number=!0),r.get("empty")==="1"&&(t.empty=!0),r.get("stale")==="1"&&(t.stale=!0),r.get("arch")==="1"&&(t.include_archived=!0),t}function x(r){switch(r.page){case"overview":return y;case"node":return r.id?`${y}/node/${encodeURIComponent(r.id)}`:`${y}/node`;case"number":return`${y}/nr/${r.number}`;case"search":{let t=new URLSearchParams;r.query&&t.set("q",r.query),Ht(r.filters,t);let e=t.toString();return`${y}/search${e?`?${e}`:""}`}case"trash":return`${y}/trash`;case"due":return`${y}/due`;case"settings":return r.section?`${y}/settings/${r.section}`:`${y}/settings`}}function ht(r){let[t,e=""]=r.split("?",2),i=new URLSearchParams(e),n=(t.startsWith(y)?t.slice(y.length):t).split("/").filter(Boolean).map(decodeURIComponent);switch(n[0]){case"node":return{page:"node",id:n[1]??null};case"nr":{let o=Number.parseInt(n[1]??"",10);return Number.isInteger(o)&&o>0?{page:"number",number:o}:{page:"overview"}}case"search":return{page:"search",query:i.get("q")??"",filters:It(i)};case"trash":return{page:"trash"};case"due":return{page:"due"};case"settings":return{page:"settings",section:n[1]??""};default:return{page:"overview"}}}var se=class{constructor(t){this.win=t;this.listeners=new Set;this.handler=()=>this.emit()}start(){this.win.addEventListener("popstate",this.handler),this.win.addEventListener("location-changed",this.handler)}stop(){this.win.removeEventListener("popstate",this.handler),this.win.removeEventListener("location-changed",this.handler)}current(){return ht(this.win.location.pathname+this.win.location.search)}navigate(t,e={}){let i=x(t);i!==this.win.location.pathname+this.win.location.search&&(e.replace?this.win.history.replaceState(null,"",i):this.win.history.pushState(null,"",i),this.win.dispatchEvent(new CustomEvent("location-changed")))}back(){this.win.history.back()}subscribe(t){return this.listeners.add(t),()=>this.listeners.delete(t)}emit(){let t=this.current();for(let e of this.listeners)e(t)}};var Ot=/^(kind|person|field_def|synonyms|settings|template|sample|import|restore|list|reload|rollback)/,pt=3e3,zt=2,Ne=class extends u{constructor(){super();this._api=null;this._nav=new se(window);this._revision=0;this._catalog=null;this._status=null;this._toastSeq=0;this._started=!1;this._bumpDebounced=$(()=>{this._revision++,this._rebuild()},120);this._typeSearch=$(e=>{let i=this._route,s=i.page==="search"?i.filters:{};if(!e.trim()&&i.page==="search"&&Object.keys(s).length===0){this._nav.navigate({page:"overview"},{replace:!0});return}!e.trim()&&i.page!=="search"||this._nav.navigate({page:"search",query:e,filters:s},{replace:i.page==="search"})},250);this.narrow=!1,this._route={page:"overview"},this._ctx=null,this._toasts=[],this._confirm=null,this._search="",this._numberId=null,this._booting=!0,this._fatal=""}static{this.properties={hass:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},panel:{attribute:!1},_route:{state:!0},_ctx:{state:!0},_toasts:{state:!0},_confirm:{state:!0},_search:{state:!0},_numberId:{state:!0},_booting:{state:!0},_fatal:{state:!0}}}static{this.styles=[v,g`
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
        flex-wrap: wrap;
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
    `]}connectedCallback(){super.connectedCallback(),this._nav.start(),this._route=this._nav.current(),this._unsubRoute=this._nav.subscribe(e=>this._onRoute(e))}disconnectedCallback(){super.disconnectedCallback(),this._nav.stop(),this._unsubRoute?.(),this._unsub?.(),this._unsub=void 0,this._started=!1}shouldUpdate(e){if(this.hasUpdated&&e.size===1&&e.has("hass")){let i=e.get("hass");return!i||i.language!==this.hass.language}return!0}willUpdate(e){e.has("narrow")&&this._api&&this._rebuild(),e.has("hass")&&this.hass&&(this._api?this._api.setHass(this.hass):this._api=new I(this.hass),this._started?e.get("hass")&&e.get("hass").language!==this.hass.language&&this._rebuild():(this._started=!0,this._boot()))}async _boot(){try{await this._loadCatalog(),this._booting=!1,this._unsub=await this._api.subscribe(e=>this._changed(e))}catch(e){this._fatal=e instanceof M&&e.code==="not_loaded"?e.message:h(e),this._booting=!1}}async _loadCatalog(){let[e,i]=await Promise.all([this._api.catalog(),this._api.status()]);this._catalog=e,this._status=i,this._rebuild()}_changed(e){e.reload||e.actions.some(i=>Ot.test(i))?this._loadCatalog().then(()=>this._bumpDebounced()):(this._api.status().then(i=>{this._status=i}),this._bumpDebounced())}_rebuild(){if(!this._api)return;let e=Me(this.hass?.language),i=this;this._ctx={get hass(){return i.hass},api:this._api,t:O(this.hass?.language),lang:e,nav:this._nav,catalog:this._catalog,status:this._status,narrow:this.narrow,revision:this._revision,go:(s,n)=>this._nav.navigate(s,n),toast:(s,n)=>i._toast(s,n),confirm:s=>i._askConfirm(s),reloadCatalog:()=>i._loadCatalog()}}_toast(e,i="info"){let s=++this._toastSeq;this._toasts=[...this._toasts,{id:s,message:e,kind:i}].slice(-zt),setTimeout(()=>this._toasts=this._toasts.filter(n=>n.id!==s),i==="error"?pt*2:pt)}_askConfirm(e){return new Promise(i=>{this._confirm={...e,resolve:i}})}_answer(e){this._confirm?.resolve(e),this._confirm=null}async _onRoute(e){if(this._route=e,this._numberId=null,e.page==="search"?this._search=e.query:e.page==="overview"&&(this._search=""),e.page==="number")try{let i=await this._api.byNumber(e.number);this._route===e&&(this._numberId={number:e.number,id:i.id})}catch(i){this._toast(h(i),"error"),this._nav.navigate({page:"overview"},{replace:!0})}}firstUpdated(){this._onRoute(this._route)}async _enter(){this._typeSearch.cancel();let e=D(this._search);if(e===null){let i=this._route;this._nav.navigate({page:"search",query:this._search,filters:i.page==="search"?i.filters:{}});return}try{let i=await this._api.byNumber(e);this._nav.navigate({page:"node",id:i.id})}catch{this._nav.navigate({page:"search",query:this._search,filters:{}})}}_back(){window.history.length>1?this._nav.back():this._nav.navigate({page:"overview"})}render(){let e=this._ctx,i=e?.t??O(this.hass?.language),s=this._route.page==="overview";return a`
      <header class="bar">
        ${this.narrow?a`<button class="icon-btn" aria-label=${i("nav.menu")} @click=${()=>this.dispatchEvent(new Event("hass-toggle-menu",{bubbles:!0,composed:!0}))}><ha-icon icon="mdi:menu"></ha-icon></button>`:c}
        ${s?c:a`<button class="icon-btn" aria-label=${i("nav.back")} @click=${this._back}><ha-icon icon="mdi:arrow-left"></ha-icon></button>`}
        ${this.narrow?c:a`<h1>${i("app.title")}</h1>`}
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
      ${this._booting?a`<main><div class="empty muted">${i("common.loading")}</div></main>`:this._fatal?a`<main><div class="empty"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><p class="error-text" role="alert">${this._fatal}</p></div></main>`:e?this._layout(e):c}
      <div class="toasts" aria-live="polite">
        ${this._toasts.map(n=>a`<div class="toast ${n.kind}" role=${n.kind==="error"?"alert":"status"}>${n.message}</div>`)}
      </div>
      ${this._confirm?a`<ot-confirm
            .heading=${this._confirm.title}
            .message=${this._confirm.message}
            .confirmLabel=${this._confirm.confirmLabel}
            .cancelLabel=${i("common.cancel")}
            .danger=${this._confirm.danger??!1}
            @confirm=${()=>this._answer(!0)}
            @cancel=${()=>this._answer(!1)}
          ></ot-confirm>`:c}
    `}_layout(e){let i=e.t,s=this._route,n=s.page==="node"?s.id??"":s.page==="number"?this._numberId?.id??"":"",o=(d,l,m,p)=>a`<button class="chip" style="min-height:36px" aria-pressed=${s.page===d?"true":"false"} @click=${()=>this._nav.navigate(m)}><ha-icon icon=${p} style="--mdc-icon-size:18px"></ha-icon>${l}</button>`;return a`
      <nav class="top" aria-label=${i("nav.main")}>
        ${o("overview",i("nav.overview"),{page:"overview"},"mdi:view-dashboard-outline")}
        ${o("node",i("nav.browse"),{page:"node",id:null},"mdi:folder-outline")}
        ${o("due",i("nav.due"),{page:"due"},"mdi:calendar-alert")}
        ${o("trash",i("nav.trash"),{page:"trash"},"mdi:delete-outline")}
      </nav>
      <div class="layout">
        ${this.narrow?c:a`<aside><ot-tree .ctx=${e} .currentId=${n}></ot-tree></aside>`}
        <main>${this._page(e)}</main>
      </div>
    `}_page(e){let i=this._route;switch(i.page){case"overview":return a`<ot-overview .ctx=${e}></ot-overview>`;case"node":return a`<ot-node-page .ctx=${e} .nodeId=${i.id}></ot-node-page>`;case"number":return this._numberId?a`<ot-node-page .ctx=${e} .nodeId=${this._numberId.id}></ot-node-page>`:a`<div class="empty muted">${e.t("common.loading")}</div>`;case"search":return a`<ot-search-page .ctx=${e} .query=${i.query} .filters=${i.filters}></ot-search-page>`;case"trash":return a`<ot-trash-page .ctx=${e}></ot-trash-page>`;case"due":return a`<ot-due-page .ctx=${e}></ot-due-page>`;case"settings":return a`<ot-settings-page .ctx=${e} .section=${i.section}></ot-settings-page>`}}};customElements.define("ordnungstracker-panel",Ne);function z(r){window.history.pushState(null,"",r),window.dispatchEvent(new CustomEvent("location-changed"))}var qe=class extends u{constructor(){super();this._api=null;this._started=!1;this._reload=$(()=>{this._load()},200);this._typed=$(()=>{this._search().catch(e=>this._error=h(e))},250);this._config={type:"custom:ordnungstracker-card",mode:"search"},this._query="",this._hits=[],this._overview=null,this._node=null,this._error=""}static{this.properties={hass:{attribute:!1},_config:{state:!0},_query:{state:!0},_hits:{state:!0},_overview:{state:!0},_node:{state:!0},_error:{state:!0}}}static getConfigElement(){return document.createElement("ordnungstracker-card-editor")}static getStubConfig(){return{type:"custom:ordnungstracker-card",mode:"tiles"}}setConfig(e){if(!e||typeof e!="object")throw new Error("Ung\xFCltige Konfiguration");if(e.mode&&!["search","tiles","node"].includes(e.mode))throw new Error(`Unbekannte Betriebsart: ${e.mode} (erlaubt: search, tiles, node)`);if(e.mode==="node"&&!e.node)throw new Error('Bei mode: node fehlt "node" (Kennung oder Nummer, z. B. 14).');this._config={...e,mode:e.mode??"search"},this._started&&this._load()}getCardSize(){return this._config.mode==="tiles"?4:this._config.mode==="node"?5:3}static{this.styles=[v,g`
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
    `]}connectedCallback(){super.connectedCallback(),this._api&&!this._unsub&&this._start()}disconnectedCallback(){super.disconnectedCallback(),this._unsub?.(),this._unsub=void 0,this._started=!1}willUpdate(e){e.has("hass")&&this.hass&&(this._api?this._api.setHass(this.hass):this._api=new I(this.hass),this._started||this._start())}shouldUpdate(e){return!(this.hasUpdated&&e.size===1&&e.has("hass"))}async _start(){this._started=!0,await this._load();try{this._unsub=await this._api.subscribe(()=>this._reload())}catch{}}async _load(){let e=this._api;if(e)try{this._error="";let i=this._config.mode;if(i==="tiles"&&(this._overview=await e.overview()),i==="node"){let s=String(this._config.node??"").trim(),n=D(s),o=n!==null?(await e.byNumber(n)).id:s;this._node=await e.node(o)}(i==="search"||i==="tiles")&&await this._search()}catch(i){this._error=h(i)}}async _search(){if(!this._query.trim()){this._hits=[];return}this._hits=(await this._api.search(this._query,{},8)).hits}async _enter(){let e=D(this._query);if(e!==null)try{z(x({page:"node",id:(await this._api.byNumber(e)).id}));return}catch{}z(x({page:"search",query:this._query,filters:{}}))}render(){let e=O(this.hass?.language),i=this._config.mode;return a`
      <ha-card>
        ${this._config.title?a`<h2>${this._config.title}</h2>`:c}
        ${i==="node"?this._nodeView(e):a`${this._searchBox(e)}${this._results(e)}${i==="tiles"?this._tiles(e):c}`}
        ${this._error?a`<div class="error-text small" role="alert">${this._error}</div>`:c}
      </ha-card>
    `}_searchBox(e){return a`<input
      type="search"
      .value=${this._query}
      placeholder=${e("search.placeholder")}
      aria-label=${e("search.placeholder")}
      @input=${i=>{this._query=i.target.value,this._typed()}}
      @keydown=${i=>i.key==="Enter"&&this._enter()}
    />`}_results(e){return this._query.trim()?this._hits.length===0?a`<div class="small muted" style="margin-top:8px">${e("search.none")}</div>`:a`<div class="list">
      ${this._hits.map(i=>a`<button class="item" @click=${()=>z(x({page:"node",id:i.id}))}>
          <span class="grow">
            <span class="row">${i.number!==null?a`<span class="badge">${i.number}</span>`:c}<span class="ellipsis">${i.name}</span></span>
            <span class="small muted ellipsis" style="display:block">${C(i.path,!1)}</span>
          </span>
        </button>`)}
    </div>`:c}_tiles(e){let i=this._overview?.overview;if(!i)return c;let s=Object.entries(i.due).filter(([o])=>o!=="below_min").reduce((o,[,d])=>o+d,0),n=(o,d,l)=>a`<button class="tile" @click=${()=>z(l)}><span class="n">${o}</span><span class="l">${d}</span></button>`;return a`<div class="tiles">
      ${n(i.containers,e("overview.containers"),y)}
      ${n(i.items,e("overview.items"),y)}
      ${n(i.unsorted,e("overview.unsorted"),x({page:"node",id:"unsortiert"}))}
      ${n(i.checked_out,e("overview.checkedOut"),x({page:"search",query:"",filters:{checked_out:!0}}))}
      ${n(s,e("overview.due"),x({page:"due"}))}
      ${n(i.due.below_min??0,e("overview.restock"),x({page:"due"}))}
    </div>`}_nodeView(e){let i=this._node;if(!i)return a`<div class="muted small">${e("common.loading")}</div>`;let s=i.id!==null?i:null;return a`
      ${s?a`<button class="btn text" style="padding:0" @click=${()=>z(x({page:"node",id:s.id}))}><strong>${s.number!==null?`${s.number} \xB7 `:""}${s.name}</strong></button>
            <div class="small muted">${C(s.path,!1)}</div>`:c}
      ${i.contents.length?a`<ot-node-list class="list" .rows=${i.contents.map(n=>H(n))} .label=${s?.name??""} @open-node=${n=>z(x({page:"node",id:n.detail}))}></ot-node-list>`:a`<div class="small muted" style="margin-top:8px">${e("node.emptyGeneric")}</div>`}
    `}};customElements.define("ordnungstracker-card",qe);var He=class extends u{static{this.properties={hass:{attribute:!1},_config:{state:!0}}}constructor(){super(),this._config={type:"custom:ordnungstracker-card",mode:"search"}}static{this.styles=[v,g`:host { display: block; } .stack { display: flex; flex-direction: column; gap: 14px; }`]}setConfig(t){this._config=t}_set(t){let e={...this._config,...t};for(let i of["title","node"])e[i]||delete e[i];e.mode!=="node"&&delete e.node,this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}render(){let t=O(this.hass?.language),e=this._config;return a`<div class="stack">
      <label class="field">${t("card.title")}<input .value=${e.title??""} @input=${i=>this._set({title:i.target.value})} /></label>
      <label class="field">${t("card.mode")}
        <select .value=${e.mode??"search"} @change=${i=>this._set({mode:i.target.value})}>
          <option value="search" ?selected=${(e.mode??"search")==="search"}>${t("card.modeSearch")}</option>
          <option value="tiles" ?selected=${e.mode==="tiles"}>${t("card.modeTiles")}</option>
          <option value="node" ?selected=${e.mode==="node"}>${t("card.modeNode")}</option>
        </select></label>
      ${e.mode==="node"?a`<label class="field">${t("card.node")}<input .value=${e.node??""} placeholder="14" @input=${i=>this._set({node:i.target.value})} /></label>
            <span class="small muted">${t("card.nodeHelp")}</span>`:c}
    </div>`}};customElements.define("ordnungstracker-card-editor",He);window.customCards=window.customCards||[];window.customCards.push({type:"ordnungstracker-card",name:"Ordnungs-Tracker",description:"Suche, Kacheln oder der Inhalt einer Kiste aus dem Ordnungs-Tracker.",preview:!1});
