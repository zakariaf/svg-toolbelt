import { SvgEnhancer } from '../core/base';

export class DblclickResetFeature {
  private enhancer: SvgEnhancer;
  private handleDblClick: (e: MouseEvent) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.handleDblClick = this._handleDblClick.bind(this);
  }

  public init(): void {
    this.enhancer.svg!.addEventListener('dblclick', this.handleDblClick);
  }

  private _handleDblClick(_event: MouseEvent): void {
    if (!this.enhancer.isDestroyed) {
      this.enhancer.reset();
    }
  }

  public destroy(): void {
    this.enhancer.svg!.removeEventListener('dblclick', this.handleDblClick);
  }
}
