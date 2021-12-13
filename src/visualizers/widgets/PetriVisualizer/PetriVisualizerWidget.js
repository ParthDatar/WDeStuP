/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Sun Dec 12 2021 21:01:45 GMT+0000 (Coordinated Universal Time).
 */

 define(['jointjs', 'css!./styles/PetriVisualizerWidget.css'], function (joint){
    'use strict';

    var WIDGET_CLASS = 'petri-visualizer';

    function PetriVisualizerWidget(logger, container) {
        this._logger = logger.fork('Widget');

        this._el = container;

        this.nodes = {};
        this._initialize();

        this._logger.debug('ctor finished');
    }

    PetriVisualizerWidget.prototype._initialize = function () {
        console.log(joint);
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        // set widget class
        this._el.addClass(WIDGET_CLASS);

        // Create a dummy header
        this._el.append('<h3>PetriVisualizer Events:</h3>');
        this._jointSM = new joint.dia.Graph;
        this._jointPaper = new joint.dia.Paper({
            el: this._el,
            width : "100%",
            height: "50%",
            model: this._jointSM,
            interactive: false
        });
        

        // this._webgmeSM = null;
    };

    PetriVisualizerWidget.prototype.onWidgetContainerResize = function (width, height) {
        this._logger.debug('Widget is resizing...');
        // if (this._jointPaper){
        //     this._jointPaper.setDimensions(width, height);
        //     this._jointPaper.scaleContentToFit();
        // }
    };

    // State Machine manipulating functions called from the controller
    PetriVisualizerWidget.prototype.initMachine = function (machineDescriptor) {
        // console.log("We are here, man, frig this trash");
        const self = this;
        console.log(machineDescriptor);

        self._webgmeSM = machineDescriptor;
        // self._webgmeSM.current = self._webgmeSM.init;
        self._jointSM.clear();
        const sm = self._webgmeSM;
        sm.id2place = {}; // this dictionary will connect the on-screen id to the state id
        sm.id2trans = {}; // this dictionary will connect the on-screen id to the trans id
        // first add the states
        Object.keys(sm.places).forEach(placeId => {
            let vertex = null;
            vertex = new joint.shapes.standard.Circle({
                position: sm.places[placeId].position,
                size: { width: 40, height: 40},
                attrs: {
                    label : {
                        text: sm.places[placeId].name + "-" + sm.places[placeId].tokens,
                        //event: 'element:label:pointerdown',
                        fontWeight: 'bold',
                        //cursor: 'text',
                        //style: {
                            //    userSelect: 'text'
                            //}
                        },
                        body: {
                            strokeWidth: 3,
                            cursor: 'pointer'
                        }
                    }
                });
                vertex.addTo(self._jointSM);
                sm.places[placeId].joint = vertex;
                sm.id2place[vertex.id] = placeId;
            });
            Object.keys(sm.transitions).forEach(transId => {
                let vertex = null;
                vertex = new joint.shapes.standard.Rectangle({
                    position: sm.transitions[transId].position,
                    size: { width: 20, height: 40},
                    attrs: {
                        label : {
                            text: sm.transitions[transId].name,
                            //event: 'element:label:pointerdown',
                            fontWeight: 'bold',
                            //cursor: 'text',
                            //style: {
                                //    userSelect: 'text'
                                //}
                            },
                            body: {
                                strokeWidth: 3,
                                cursor: 'pointer'
                            }
                        }
                    });
                    
                    vertex.addTo(self._jointSM);
                    sm.transitions[transId].joint = vertex;
                    sm.id2trans[vertex.id] = transId;
                });
                
        // then create the links
        Object.keys(sm.places).forEach(placeId => {
            const place = sm.places[placeId];
            place.outtransitions.forEach(trans => {
                place.jointNext = place.jointNext || {};
                const link = new joint.shapes.standard.Link({
                    source: {id: place.joint.id},
                    target: {id: sm.transitions[trans].joint.id},
                    attrs: {
                        line: {
                            strokeWidth: 2
                        },
                        wrapper: {
                            cursor: 'default'
                        }
                    },
                    labels: [{
                        position: {
                            distance: 0.5,
                            offset: 0,
                            args: {
                                keepGradient: true,
                                ensureLegibility: true
                            }
                        }
                    }]
                });
                link.addTo(self._jointSM);
                place.jointNext[trans] = link;
            })
        });
        
        Object.keys(sm.transitions).forEach(transId => {
            const trans = sm.transitions[transId];
            trans.outplaces.forEach(place => {
                trans.jointNext = trans.jointNext || {};
                const link = new joint.shapes.standard.Link({
                    source: {id: trans.joint.id},
                    target: {id: sm.places[place].joint.id},
                    attrs: {
                        line: {
                            strokeWidth: 2
                        },
                        wrapper: {
                            cursor: 'default'
                        }
                    },
                    labels: [{
                        position: {
                            distance: 0.5,
                            offset: 0,
                            args: {
                                keepGradient: true,
                                ensureLegibility: true
                            }
                        }
                    }]
                });
                link.addTo(self._jointSM);
                trans.jointNext[place] = link;
            })
        });
        
        //now refresh the visualization
        self._jointPaper.updateViews();
        console.log(self._jointPaper);
        self._decorateMachine();
    };
    
    PetriVisualizerWidget.prototype.destroyMachine = function () {
        
    };
    
    PetriVisualizerWidget.prototype.fireEvent = function (event) {
        const self = this;
        const sm = this._webgmeSM;
        sm.transitions[event].inplaces.forEach(placeId => {
            sm.places[placeId].tokens--;
            sm.places[placeId].joint.attr('label/text', sm.places[placeId].name + '-' + sm.places[placeId].tokens)
            const link = sm.places[placeId].jointNext[event];
            const linkView = link.findView(self._jointPaper);
            linkView.sendToken(joint.V('circle', { r: 10, fill: 'black' }), {duration:500}, function(){});
        });
        setTimeout(sm.transitions[event].outplaces.forEach(placeId => {
            sm.places[placeId].tokens++;
            sm.places[placeId].joint.attr('label/text', sm.places[placeId].name + '-' + sm.places[placeId].tokens)
            const link = sm.transitions[event].jointNext[placeId];
            const linkView = link.findView(self._jointPaper);
            linkView.sendToken(joint.V('circle', { r: 10, fill: 'black' }), {duration:500}, function(){});
        }), 500);
        sm._decorateMachine();
    };

    PetriVisualizerWidget.prototype.resetMachine = function () {
        const self = this;
        const sm = this._webgmeSM;

        Object.keys(sm.places).forEach(placeId => {
            sm.places[placeId].tokens = sm.places[placeId].inittokens;
        });

        self._decorateMachine();
    };

    PetriVisualizerWidget.prototype._decorateMachine = function() {
        const sm = this._webgmeSM;
        var enabled = {};

        Object.keys(sm.transitions).forEach(transId => {
            enabled[transId] = true;
            if(sm.transitions[transId].inplaces.length == 0){
                enabled[transId] = false;
            }
            else{
                sm.transitions[transId].inplaces.forEach(placeId =>{
                    if(sm.places[placeId].tokens == 0){
                        enabled[transId] = false;
                        
                    }
                });
            }
            if(enabled[transId]){
                sm.transitions[transId].joint.attr('body/stroke', 'blue');
            }
            else{
                sm.transitions[transId].joint.attr('body/stroke', '#333333');
            }
        });
        sm.setFireableEvents(enabled);
    };
    /* * * * * * * * Visualizer event handlers * * * * * * * */

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    PetriVisualizerWidget.prototype.destroy = function () {
    };

    PetriVisualizerWidget.prototype.onActivate = function () {
        this._logger.debug('PetriVisualizerWidget has been activated');
    };

    PetriVisualizerWidget.prototype.onDeactivate = function () {
        this._logger.debug('PetriVisualizerWidget has been deactivated');
    };

    return PetriVisualizerWidget;
});
