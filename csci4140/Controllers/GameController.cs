﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace csci4140.Controllers
{
    [Authorize]
    public class GameController : Controller
    {
        //
        // GET: /Game/Lobby

        public ActionResult Lobby()
        {
            return View();
        }

        //
        // GET: /Game/SinglePlayer

        public ActionResult SinglePlayer()
        {
            return View();
        }
    }
}
