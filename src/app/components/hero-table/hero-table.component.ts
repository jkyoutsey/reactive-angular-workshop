import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeroService } from '../../services/hero.service';

@Component({
    selector: 'rx-hero-table',
    templateUrl: './hero-table.component.html',
    styleUrls: ['./hero-table.component.scss'],
})
export class HeroTableComponent implements OnInit {
    vm$ = combineLatest([
        this.hero.search$,
        this.hero.limit$,
        this.hero.page$,
        this.hero.heroes$,
        this.hero.totalPages$,
        this.hero.totalResults$,
    ]).pipe(
        map(([search, limit, page, heroes, totalPages, totalResults]) => ({
            search,
            limit,
            userPage: page + 1,
            heroes,
            totalPages,
            totalResults,
            disablePrevious: page === 0,
            disableNext: page + 1 === totalPages,
        })),
    );

    constructor(public hero: HeroService) {}

    ngOnInit() {}

    onSearchInput(e: any) {
        this.hero.search(e.target.value);
    }

    movePageBy(amount: number) {
        this.hero.movePageBy(amount);
    }

    setLimit(limit: number) {
        this.hero.setLimit(limit);
    }
}
