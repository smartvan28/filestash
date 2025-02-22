import rxjs from "../../lib/rx.js";
import ajax from "../../lib/ajax.js";

window.ajax = ajax;

const sessionSubject$ = new rxjs.Subject();

const adminSession$ = rxjs.merge(
    sessionSubject$,
    rxjs.interval(30000).pipe(
        rxjs.startWith(null),
        rxjs.mergeMap(() => ajax({ url: "/admin/api/session", responseType: "json" })),
        rxjs.map(({ responseJSON }) => responseJSON.result),
        rxjs.distinctUntilChanged(),
        rxjs.shareReplay(1),
    ),
);

export function isAdmin$() {
    return adminSession$;
}

export function authenticate$() {
    return rxjs.pipe(
        rxjs.mergeMap((body) => ajax({
            url: "/admin/api/session",
            method: "POST", body, responseType: "json",
        }).pipe(
            rxjs.mapTo(true),
            rxjs.catchError(() => rxjs.of(false)),
            rxjs.tap((ok) => ok && sessionSubject$.next(ok))
        )),
    );
}
