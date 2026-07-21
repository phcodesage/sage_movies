/**
 * PopAds publisher tag (site ID 5194452).
 *
 * Rendered as a plain <script> inside <head> in app/layout.tsx — NOT via next/script.
 * That is deliberate: next/script injects the tag client-side after hydration, so it
 * is absent from the served HTML and PopAds' Troubleshooter (which fetches raw HTML)
 * reports the tag as missing. A server-rendered <script> in <head> matches their
 * documented install exactly.
 *
 * The blob is pasted verbatim from the PopAds dashboard — do not "tidy" it. The
 * obfuscation, the arithmetic site ID and the base64 host list are load-bearing, and
 * the vendor regenerates the whole thing when settings change. To update: re-copy
 * from popads.net and replace the template literal wholesale.
 *
 * It is inline rather than an external /popads.js file on purpose: `popads.js` as a
 * filename is matched by EasyList and friends, so a separate file gets blocked by
 * adblockers before it ever runs.
 *
 * `data-cfasync="false"` must be preserved — it stops Cloudflare Rocket Loader from
 * deferring and breaking the tag.
 *
 * Gated on NEXT_PUBLIC_POPADS_ENABLED so local dev doesn't fire popunders on reload.
 */

const POPADS_TAG = `
/*<![CDATA[/* */
(function(){var q=window,p="d2c3775c018b9b078676b93a2f928450",u=[["siteId",864+579*116+5126424],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],o=["d3d3LmJsb2NrYWRzbm90LmNvbS9tcmlvdC5taW4uY3Nz","ZG5oZmk1bm4yZHQ2Ny5jbG91ZGZyb250Lm5ldC91QVFNSy9pY2hhcnRpc3QubWluLmpz"],i=-1,z,b,t=function(){clearTimeout(b);i++;if(o[i]&&!(1810566798000<(new Date).getTime()&&1<i)){z=q.document.createElement("script");z.type="text/javascript";z.async=!0;var l=q.document.getElementsByTagName("script")[0];z.src="https://"+atob(o[i]);z.crossOrigin="anonymous";z.onerror=t;z.onload=function(){clearTimeout(b);q[p.slice(0,16)+p.slice(0,16)]||t()};b=setTimeout(t,5E3);l.parentNode.insertBefore(z,l)}};if(!q[p]){try{Object.freeze(q[p]=u)}catch(e){}t()}})();
/*]]>/* */
`;

export default function PopAds() {
  if (process.env.NEXT_PUBLIC_POPADS_ENABLED !== 'true') return null;

  return (
    <script
      type="text/javascript"
      data-cfasync="false"
      dangerouslySetInnerHTML={{ __html: POPADS_TAG }}
    />
  );
}
