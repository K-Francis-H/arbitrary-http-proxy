module little_hill(){
    color("red")
    hull(){
        for(i=[-14:14]){
            x=i;
            y=-0.1*(x*x)+20;
            //echo("x=",x," y=",y);
            translate([x,y,0])
            cylinder(d=1,h=1);
        }
    }
}

module big_hill(){
    color("green")
    hull(){
        for(i=[-0.5:31]){
            x=i;
            y=-0.11*( (x-15)*(x-15))+27;
            //echo("x=",x," y=",y);
            translate([x,y,0])
            cylinder(d=1,h=1);
        }
    }
}

module arch(width, length){
    r_length=length-width;
    cube([width,r_length,1]);
    translate([width/2,r_length,0]){
        cylinder(d=width, h=1);
    }
}

projection(){

    translate([0.5,0,0])
    difference(){
        big_hill();
        little_hill();
    }
    /*
    translate([-0.5,0,0])
    difference(){
        little_hill();
        big_hill();
    }*/


    
    difference(){
        little_hill();
        translate([-7.5/2,0,0])
        arch(7.5,15);
        //difference(){
        //    arch(7.5,15);
        //    translate([0.5,0,0])
        //        arch(6.5,14);
        //}
    }

    translate([0,0.75,0])
    difference(){
        linear_extrude(1)
        translate([-5.5,15.5,0])
        scale([0.1,0.1,1])
            import("78378-planet-sphere.svg");
        union(){
            big_hill();
            little_hill();
        }
    }
}