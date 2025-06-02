import { SvgEnhancer } from '../core/base';

export class NoContextMenuFeature {
  private enhancer: SvgEnhancer;
  private handleContextMenu: (e: MouseEvent) => void;

  constructor(enhancer: SvgEnhancer) {
    this.enhancer = enhancer;
    this.handleContextMenu = (e: MouseEvent) => e.preventDefault();
  }

  public init(): void {
    this.enhancer.container.addEventListener(
      'contextmenu',
      this.handleContextMenu
    );
  }

  public destroy(): void {
    this.enhancer.container.removeEventListener(
      'contextmenu',
      this.handleContextMenu
    );
  }
}
