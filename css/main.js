function load_script(src, remote = true, transfer = []) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error("تعذر تحميل الملف: " + src));
    document.head.appendChild(script);
  });
}

async function fetch_binary(url) {
  const response = await fetch(url);
  if (!response || !response.ok) {
    throw new Error("تعذر تحميل الملف: " + url);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function doJb() {
  await load_script("css/misc.js");

  try {
    version.init();
    switch (version.console) {
      case 4:
        await load_script("css/ps4/constants.js");
        await load_script("css/ps4/userland.js");
        break;
      case 5:
        //TODO
        break;
      default:
        logger.info("Unsupported console " + version.console);
    }

    logger.info("===USERLAND===");

    let rw = undefined;
    if (arw.master === undefined) {
      rw = await init_rw();
    }

    init_arw(rw);
    init_rop();
    init_syscalls();

    logger.info("===END===");

    await load_script("css/loader.js");
    await load_script("css/workers.js");

    switch (version.console) {
      case 4:
        await load_script("css/ps4/kernel.js");
        break;
      case 5:
        //TODO
        break;
      default:
        logger.info("Unsupported console " + version.console);
    }

    if (fn.setuid.invoke(0) !== -1) {
      msgs.innerHTML = "تم تحميل GoldHEN بالفعل .تحياتي، مركز بشير ...";
      return;
    }

    var exploitChain = localStorage.getItem("exploitChain") || "lapse";
    await load_script("css/" + exploitChain + ".js");
    logger.info("===" + exploitChain.toUpperCase() + "===");

    try {
      if (exploitChain == "lapse") {
        init();
        await setup();
        await double_free_reqs2();
        leak_kaddrs();
        double_free_reqs1();
        make_karw();
        inc_karw_pipe_refcnt();

        logger.info("Corrupted context cleanup started...");
        remove_pktinfo_from_so(pktopts_twins[0]);
        remove_rthdr_from_so(pktopts_twins[1]);
        remove_rthdr_from_so(rthdr_twins[0]);
        logger.info("Corrupted context cleanup completed !!");
      } else {
        init();
        await setup();
        await ucred_triple_free();
        leak_kqueue();
        await make_karw();
        inc_karw_pipe_refcnt();

        logger.info("Corrupted context cleanup started...");
        for (let i = 0; i < triplets.length; i++) {
          remove_rthdr_from_so(triplets[i]);
        }
        remove_uaf_file();
        logger.info("Corrupted context cleanup completed !!");
      }
    } finally {
      cleanup();
    }

    find_all_proc();

    if (fn.setuid.invoke(0) === -1) {
      jailbreak();

      const kpatches_u8 = await fetch_binary("css/ps4/patches/" + constants.KPATCH);
      kernel_patches(kpatches_u8);

      const bin_u8 = await fetch_binary("goldhen_2.4b18.10.bin");
      load_bin(bin_u8);
    }

    msgs.innerHTML = "تم تحميل GoldHEN بنجاح .تحياتي، مركز بشير ...";
    logger.info("===END===");
  } catch (e) {
    console.error(e);
    msgs.innerHTML = "فشل تحميل أحد الملفات. امسح الكاش وأعد المحاولة.";
    msgs.style.color = "yellow";
  }
}
