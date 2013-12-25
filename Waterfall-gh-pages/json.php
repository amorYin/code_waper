<?php

/* Generate JSON string of image data to the waterfall. */

$num = $_GET["n"];

$arr = array();

for($i = 0; $i < $num; $i++) {
  $src = rand(1, 6);
  $size = getimagesize("img/" . $src . ".jpg");
  $height = 230;
//  if($size[0] != 190) {
//    $height = 190 * $size[1] / $size[0];
//  }
  $arr[$i] = array("title" => "demo picture " . $src, "src" => $src, "height" => $height, "width" => 200);
}

// Faking network latency.
sleep(1);

echo json_encode($arr);

?>