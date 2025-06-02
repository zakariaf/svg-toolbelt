
import { SvgEnhancer } from "../core/base";

export class DblclickResetFeature {
  private enhancer: SvgEnhancer;
  private handleDblClick: (e: MouseEvent) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.handleDblClick = this._handleDblClick.bind(this);
  }

  public init(): void {
    this.enhancer.svg!.addEventListener("dblclick", this.handleDblClick);
  }

  private _handleDblClick(_: MouseEvent): void {
    if (!this.enhancer.isDestroyed) {
      this.enhancer.scale = 1;
      this.enhancer.translateX = 0;
      this.enhancer.translateY = 0;
      this.enhancer.svg!.style.transform = `translate(0px, 0px) scale(1)`;
    }
  }

  public destroy(): void {
    this.enhancer.svg!.removeEventListener("dblclick", this.handleDblClick);
  }
}
