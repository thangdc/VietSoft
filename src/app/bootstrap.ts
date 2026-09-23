export type BootstrapModule = () => void | Promise<void>;

export async function bootstrap(...modules: BootstrapModule[]): Promise<void> {
  for (const module of modules) {
    await module();
  }
}
