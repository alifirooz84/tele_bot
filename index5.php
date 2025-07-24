<?php
file_put_contents("log.txt", date('Y-m-d H:i:s') . " - request received\n", FILE_APPEND);
echo "ربات فعال است";
