import{Faceplate as t,Knob as n,Patch as e}from"https://olney.ai/patchcab/js/core.js";function _(t){let _,o,c,r,i,$,v;function u(n){t[2](n)}let m={label:"decay",x:20,y:60,min:s,max:a,precision:2};return void 0!==t[0].decay&&(m.value=t[0].decay),_=new n({props:m}),__sv.binding_callbacks.push((()=>__sv.bind(_,"value",u))),r=new e({props:{label:"in",x:20,y:320,name:"audio-in",input:t[1]}}),$=new e({props:{label:"out",x:60,y:320,name:"audio-out",output:t[1]}}),{c(){__sv.create_component(_.$$.fragment),c=__sv.space(),__sv.create_component(r.$$.fragment),i=__sv.space(),__sv.create_component($.$$.fragment)},m(t,n){__sv.mount_component(_,t,n),__sv.insert(t,c,n),__sv.mount_component(r,t,n),__sv.insert(t,i,n),__sv.mount_component($,t,n),v=!0},p(t,n){const e={};!o&&1&n&&(o=!0,e.value=t[0].decay,__sv.add_flush_callback((()=>o=!1))),_.$set(e);const s={};2&n&&(s.input=t[1]),r.$set(s);const a={};2&n&&(a.output=t[1]),$.$set(a)},i(t){v||(__sv.transition_in(_.$$.fragment,t),__sv.transition_in(r.$$.fragment,t),__sv.transition_in($.$$.fragment,t),v=!0)},o(t){__sv.transition_out(_.$$.fragment,t),__sv.transition_out(r.$$.fragment,t),__sv.transition_out($.$$.fragment,t),v=!1},d(t){__sv.destroy_component(_,t),t&&__sv.detach(c),__sv.destroy_component(r,t),t&&__sv.detach(i),__sv.destroy_component($,t)}}}function o(n){let e,o;return e=new t({props:{title:"REVRB",color:"var(--color-2)",light:!0,$$slots:{default:[_]},$$scope:{ctx:n}}}),{c(){__sv.create_component(e.$$.fragment)},m(t,n){__sv.mount_component(e,t,n),o=!0},p(t,[n]){const _={};11&n&&(_.$$scope={dirty:n,ctx:t}),e.$set(_)},i(t){o||(__sv.transition_in(e.$$.fragment,t),o=!0)},o(t){__sv.transition_out(e.$$.fragment,t),o=!1},d(t){__sv.destroy_component(e,t)}}}const s=.01,a=10;function c(t,n,e){let{state:_={decay:1.15}}=n;const o=new Tone.Reverb(_.decay);return t.$$set=t=>{"state"in t&&e(0,_=t.state)},t.$$.update=()=>{1&t.$$.dirty&&e(1,o.decay=_.decay,o)},[_,o,function(n){t.$$.not_equal(_.decay,n)&&(_.decay=n,e(0,_))}]}class r extends __sv.SvelteComponent{constructor(t){super(),__sv.init(this,t,c,o,__sv.safe_not_equal,{state:0})}}export{r as default};
