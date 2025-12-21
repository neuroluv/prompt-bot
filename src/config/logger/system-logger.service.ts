import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class SystemLoggerService extends ConsoleLogger {
  protected getTimestamp(): string {
    return new Date().toLocaleString('ru');
  }

  startApp(port: number, env: string) {
    console.log(
      `
==================================
      `,
    );
    // console.log(
    //   `
    //   ██╗░░██╗███████╗██████╗░░░██╗██╗██╗██╗░░██╗░░███╗░░██████╗░
    //   ██║░██╔╝██╔════╝██╔══██╗░██╔╝██║██║██║░██╔╝░████║░░╚════██╗
    //   █████═╝░█████╗░░██████╔╝██╔╝░██║██║█████═╝░██╔██║░░░█████╔╝
    //   ██╔═██╗░██╔══╝░░██╔══██╗███████║██║██╔═██╗░╚═╝██║░░░╚═══██╗
    //   ██║░╚██╗███████╗██║░░██║╚════██║██║██║░╚██╗███████╗██████╔╝
    //   ╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝░░░░░╚═╝╚═╝╚═╝░░╚═╝╚══════╝╚═════╝░
    //   `,
    // );
    this.debug(`Server started on port: ${port}`);
    this.debug(`http://localhost:${port}`);
    this.debug(`Environment: ${env}`);
  }
}
