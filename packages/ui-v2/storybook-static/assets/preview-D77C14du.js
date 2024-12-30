import{d as Y}from"./index-DrFu-skq.js";const{useEffect:_,useMemo:h}=__STORYBOOK_MODULE_PREVIEW_API__,{global:H}=__STORYBOOK_MODULE_GLOBAL__,{logger:K}=__STORYBOOK_MODULE_CLIENT_LOGGER__;var g="backgrounds",C={light:{name:"light",value:"#F8F8F8"},dark:{name:"dark",value:"#333"}},{document:$,window:T}=H,I=()=>{var r;return!!((r=T==null?void 0:T.matchMedia("(prefers-reduced-motion: reduce)"))!=null&&r.matches)},A=r=>{(Array.isArray(r)?r:[r]).forEach(P)},P=r=>{var t;let e=$.getElementById(r);e&&((t=e.parentElement)==null||t.removeChild(e))},z=(r,e)=>{let t=$.getElementById(r);if(t)t.innerHTML!==e&&(t.innerHTML=e);else{let d=$.createElement("style");d.setAttribute("id",r),d.innerHTML=e,$.head.appendChild(d)}},U=(r,e,t)=>{var a;let d=$.getElementById(r);if(d)d.innerHTML!==e&&(d.innerHTML=e);else{let o=$.createElement("style");o.setAttribute("id",r),o.innerHTML=e;let i=`addon-backgrounds-grid${t?`-docs-${t}`:""}`,n=$.getElementById(i);n?(a=n.parentElement)==null||a.insertBefore(o,n):$.head.appendChild(o)}},j={cellSize:100,cellAmount:10,opacity:.8},w="addon-backgrounds",R="addon-backgrounds-grid",X=I()?"":"transition: background-color 0.3s;",N=(r,e)=>{let{globals:t,parameters:d,viewMode:a,id:o}=e,{options:i=C,disable:n,grid:s=j}=d[g]||{},c=t[g]||{},u=c.value,l=u?i[u]:void 0,b=(l==null?void 0:l.value)||"transparent",f=c.grid||!1,y=!!l&&!n,m=a==="docs"?`#anchor--${o} .docs-story`:".sb-show-main",E=a==="docs"?`#anchor--${o} .docs-story`:".sb-show-main",D=d.layout===void 0||d.layout==="padded",L=a==="docs"?20:D?16:0,{cellAmount:k,cellSize:p,opacity:x,offsetX:v=L,offsetY:S=L}=s,B=a==="docs"?`${w}-docs-${o}`:`${w}-color`,G=a==="docs"?o:null;_(()=>{let O=`
    ${m} {
      background: ${b} !important;
      ${X}
      }`;if(!y){A(B);return}U(B,O,G)},[m,B,G,y,b]);let M=a==="docs"?`${R}-docs-${o}`:`${R}`;return _(()=>{if(!f){A(M);return}let O=[`${p*k}px ${p*k}px`,`${p*k}px ${p*k}px`,`${p}px ${p}px`,`${p}px ${p}px`].join(", "),F=`
        ${E} {
          background-size: ${O} !important;
          background-position: ${v}px ${S}px, ${v}px ${S}px, ${v}px ${S}px, ${v}px ${S}px !important;
          background-blend-mode: difference !important;
          background-image: linear-gradient(rgba(130, 130, 130, ${x}) 1px, transparent 1px),
           linear-gradient(90deg, rgba(130, 130, 130, ${x}) 1px, transparent 1px),
           linear-gradient(rgba(130, 130, 130, ${x/2}) 1px, transparent 1px),
           linear-gradient(90deg, rgba(130, 130, 130, ${x/2}) 1px, transparent 1px) !important;
        }
      `;z(M,F)},[k,p,E,M,f,v,S,x]),r()},W=(r,e=[],t)=>{if(r==="transparent")return"transparent";if(e.find(a=>a.value===r)||r)return r;let d=e.find(a=>a.name===t);if(d)return d.value;if(t){let a=e.map(o=>o.name).join(", ");K.warn(Y`
        Backgrounds Addon: could not find the default color "${t}".
        These are the available colors for your story based on your configuration:
        ${a}.
      `)}return"transparent"},q=(r,e)=>{var u;let{globals:t,parameters:d}=e,a=(u=t[g])==null?void 0:u.value,o=d[g],i=h(()=>o.disable?"transparent":W(a,o.values,o.default),[o,a]),n=h(()=>i&&i!=="transparent",[i]),s=e.viewMode==="docs"?`#anchor--${e.id} .docs-story`:".sb-show-main",c=h(()=>`
      ${s} {
        background: ${i} !important;
        ${I()?"":"transition: background-color 0.3s;"}
      }
    `,[i,s]);return _(()=>{let l=e.viewMode==="docs"?`addon-backgrounds-docs-${e.id}`:"addon-backgrounds-color";if(!n){A(l);return}U(l,c,e.viewMode==="docs"?e.id:null)},[n,c,e]),r()},J=(r,e)=>{var y;let{globals:t,parameters:d}=e,a=d[g].grid,o=((y=t[g])==null?void 0:y.grid)===!0&&a.disable!==!0,{cellAmount:i,cellSize:n,opacity:s}=a,c=e.viewMode==="docs",u=d.layout===void 0||d.layout==="padded"?16:0,l=a.offsetX??(c?20:u),b=a.offsetY??(c?20:u),f=h(()=>{let m=e.viewMode==="docs"?`#anchor--${e.id} .docs-story`:".sb-show-main",E=[`${n*i}px ${n*i}px`,`${n*i}px ${n*i}px`,`${n}px ${n}px`,`${n}px ${n}px`].join(", ");return`
      ${m} {
        background-size: ${E} !important;
        background-position: ${l}px ${b}px, ${l}px ${b}px, ${l}px ${b}px, ${l}px ${b}px !important;
        background-blend-mode: difference !important;
        background-image: linear-gradient(rgba(130, 130, 130, ${s}) 1px, transparent 1px),
         linear-gradient(90deg, rgba(130, 130, 130, ${s}) 1px, transparent 1px),
         linear-gradient(rgba(130, 130, 130, ${s/2}) 1px, transparent 1px),
         linear-gradient(90deg, rgba(130, 130, 130, ${s/2}) 1px, transparent 1px) !important;
      }
    `},[n]);return _(()=>{let m=e.viewMode==="docs"?`addon-backgrounds-grid-docs-${e.id}`:"addon-backgrounds-grid";if(!o){A(m);return}z(m,f)},[o,f,e]),r()},V=FEATURES!=null&&FEATURES.backgroundsStoryGlobals?[N]:[J,q],ee={[g]:{grid:{cellSize:20,opacity:.5,cellAmount:5},disable:!1,...!(FEATURES!=null&&FEATURES.backgroundsStoryGlobals)&&{values:Object.values(C)}}},Q={[g]:{value:void 0,grid:!1}},re=FEATURES!=null&&FEATURES.backgroundsStoryGlobals?Q:{[g]:null};export{V as decorators,re as initialGlobals,ee as parameters};
