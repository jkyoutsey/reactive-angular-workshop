import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    map,
    shareReplay,
    switchMap,
} from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Hero {
    id: number;
    name: string;
    description: string;
    thumbnail: HeroThumbnail;
    resourceURI: string;
    comics: HeroSubItems;
    events: HeroSubItems;
    series: HeroSubItems;
    stories: HeroSubItems;
}

export interface HeroThumbnail {
    path: string;
    extendion: string;
}

export interface HeroSubItems {
    available: number;
    returned: number;
    collectionURI: string;
    items: HeroSubItem[];
}

export interface HeroSubItem {
    resourceURI: string;
    name: string;
}

// The URL to the Marvel API
const HERO_API = `${environment.MARVEL_API.URL}/v1/public/characters`;

// Our Limits for Search
const LIMIT_LOW = 10;
const LIMIT_MID = 25;
const LIMIT_HIGH = 100;
const LIMITS = [LIMIT_LOW, LIMIT_MID, LIMIT_HIGH];

const DEFAULT_PAGE = 0;
const DEFAULT_SEARCH = '';
const DEFAULT_LIMIT = LIMIT_LOW;
@Injectable({
    providedIn: 'root',
})
export class HeroService {
    limits = LIMITS;

    private pageBS = new BehaviorSubject<number>(DEFAULT_PAGE);
    private limitBS = new BehaviorSubject<number>(DEFAULT_LIMIT);
    private searchBS = new BehaviorSubject<string>(DEFAULT_SEARCH);

    search$ = this.searchBS.asObservable();
    limit$ = this.limitBS.asObservable();
    page$ = this.pageBS.asObservable();

    private params$ = combineLatest([
        this.search$,
        this.limit$,
        this.page$,
    ]).pipe(
        distinctUntilChanged(
            (current, previous) =>
                JSON.stringify(current) === JSON.stringify(previous),
        ),
        map(([search, limit, page]) => {
            const params: any = {
                apikey: environment.MARVEL_API.PUBLIC_KEY,
                limit: `${limit}`,
                offset: `${page * limit}`,
            };
            if (search.length) {
                params.nameStartsWith = search;
            }
            return params;
        }),
    );

    private heroesResponse$: Observable<any> = this.params$.pipe(
        debounceTime(500),
        switchMap((params: any) => this.http.get(HERO_API, { params })),
        shareReplay(1),
    );

    totalResults$ = this.heroesResponse$.pipe(
        map((res: any) => res.data.total),
    );

    heroes$: Observable<Hero[]> = this.heroesResponse$.pipe(
        map((res: any) => res.data.results),
    );

    totalPages$ = combineLatest([this.totalResults$, this.limitBS]).pipe(
        map(([totalResults, limit]) => Math.ceil(totalResults / limit)),
    );

    constructor(private http: HttpClient) {}

    search(term: string) {
        this.searchBS.next(term);
        this.resetPage();
    }

    movePageBy(amount: number) {
        const currentPage = this.pageBS.getValue();
        this.pageBS.next(currentPage + amount);
    }

    setLimit(limit: number) {
        this.limitBS.next(limit);
        this.resetPage();
    }

    private resetPage() {
        this.pageBS.next(DEFAULT_PAGE);
    }
}
